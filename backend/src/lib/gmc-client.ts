/**
 * Google Content API for Shopping v2.1 — lightweight client.
 *
 * Auth: Service Account JSON key (base64-encoded) stored in
 *   store.metadata.integrations_config.integrations[id="gmc"].configFields.serviceAccountKey
 *
 * Implements JWT/OAuth2 service-account flow entirely with Node.js built-ins
 * (crypto + fetch) — no googleapis package needed.
 *
 * Usage:
 *   const client = new GmcClient(merchantId, serviceAccountKeyBase64)
 *   await client.upsertProduct(payload)
 *   await client.batchUpsert(payloads)
 *   await client.deleteProduct(offerId)
 *   const statuses = await client.listProductStatuses()
 */

import { createSign } from "crypto"
import type { GmcProduct } from "./gmc-transformer"

const CONTENT_API = "https://shoppingcontent.googleapis.com/content/v2.1"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SCOPE = "https://www.googleapis.com/auth/content"
const TOKEN_TTL_MS = 55 * 60 * 1000 // 55 min (tokens valid 1 h)

interface ServiceAccountKey {
  client_email: string
  private_key: string
  project_id?: string
}

interface TokenCache {
  token: string
  expiresAt: number
}

// Module-level token cache (keyed by client_email)
const tokenCache = new Map<string, TokenCache>()

// ─── JWT signing ──────────────────────────────────────────────────────────────

function base64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const cached = tokenCache.get(sa.client_email)
  if (cached && cached.expiresAt > Date.now()) return cached.token

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  )

  const sigInput = `${header}.${claim}`
  const sign = createSign("RSA-SHA256")
  sign.update(sigInput)
  const sig = base64url(sign.sign(sa.private_key))
  const jwt = `${sigInput}.${sig}`

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  })

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GMC token error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache.set(sa.client_email, {
    token: data.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })
  return data.access_token
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class GmcClient {
  private merchantId: string
  private sa: ServiceAccountKey

  constructor(merchantId: string, serviceAccountKeyBase64: string) {
    this.merchantId = merchantId
    try {
      this.sa = JSON.parse(
        Buffer.from(serviceAccountKeyBase64, "base64").toString("utf-8")
      ) as ServiceAccountKey
    } catch {
      throw new Error("GMC: invalid serviceAccountKey — must be base64-encoded JSON")
    }
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await getAccessToken(this.sa)
    return { Authorization: `Bearer ${token}` }
  }

  private productUrl(offerId?: string): string {
    const base = `${CONTENT_API}/products`
    if (!offerId) return base
    // Content API product ID format: channel:contentLanguage:targetCountry:offerId
    const id = encodeURIComponent(`online:en:IN:${offerId}`)
    return `${base}/${id}`
  }

  private toApiProduct(p: GmcProduct): Record<string, unknown> {
    return {
      offerId: p.offerId,
      itemGroupId: p.itemGroupId,
      title: p.title,
      description: p.description,
      link: p.link,
      imageLink: p.imageLink,
      ...(p.additionalImageLinks.length > 0
        ? { additionalImageLinks: p.additionalImageLinks }
        : {}),
      availability: p.availability,
      ...(p.availabilityDate ? { availabilityDate: p.availabilityDate } : {}),
      price: { value: p.price.value, currency: p.price.currency },
      brand: p.brand,
      condition: p.condition,
      ...(p.gtin ? { gtin: p.gtin } : {}),
      ...(p.mpn ? { mpn: p.mpn } : {}),
      identifierExists: p.identifierExists,
      ...(p.googleProductCategory ? { googleProductCategory: p.googleProductCategory } : {}),
      ...(p.productType ? { productTypes: [p.productType] } : {}),
      ...(p.ageGroup ? { ageGroup: p.ageGroup } : {}),
      ...(p.gender ? { gender: p.gender } : {}),
      ...(p.color ? { color: p.color } : {}),
      ...(p.size ? { sizes: [p.size] } : {}),
      targetCountry: p.targetCountry,
      feedLabel: p.feedLabel,
      contentLanguage: p.contentLanguage,
      channel: p.channel,
      ...(p.customLabel0 !== undefined ? { customLabel0: p.customLabel0 } : {}),
      ...(p.customLabel1 !== undefined ? { customLabel1: p.customLabel1 } : {}),
      ...(p.customLabel2 !== undefined ? { customLabel2: p.customLabel2 } : {}),
      ...(p.customLabel3 !== undefined ? { customLabel3: p.customLabel3 } : {}),
      ...(p.customLabel4 !== undefined ? { customLabel4: p.customLabel4 } : {}),
    }
  }

  /** Insert or update a single product */
  async upsertProduct(product: GmcProduct): Promise<void> {
    const auth = await this.authHeader()
    const url = `${CONTENT_API}/${this.merchantId}/products`
    const res = await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(this.toApiProduct(product)),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GMC upsert failed ${res.status}: ${text}`)
    }
  }

  /**
   * Batch upsert up to 1000 products using products.custombatch.
   * Splits into chunks of 500 automatically.
   */
  async batchUpsert(products: GmcProduct[]): Promise<{ errors: string[] }> {
    const CHUNK = 500
    const errors: string[] = []

    for (let i = 0; i < products.length; i += CHUNK) {
      const chunk = products.slice(i, i + CHUNK)
      const auth = await this.authHeader()

      const entries = chunk.map((p, idx) => ({
        batchId: i + idx,
        merchantId: this.merchantId,
        method: "insert",
        product: this.toApiProduct(p),
      }))

      const res = await fetch(`${CONTENT_API}/products/batch`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      })

      if (!res.ok) {
        const text = await res.text()
        errors.push(`Batch ${i}-${i + chunk.length} failed ${res.status}: ${text}`)
        continue
      }

      const data = (await res.json()) as {
        entries?: { errors?: { message: string }[] }[]
      }
      for (const entry of data.entries || []) {
        for (const err of entry.errors || []) {
          errors.push(err.message)
        }
      }
    }

    return { errors }
  }

  /** Delete a product from Google by offerId */
  async deleteProduct(offerId: string): Promise<void> {
    const auth = await this.authHeader()
    const id = encodeURIComponent(`online:en:IN:${offerId}`)
    const url = `${CONTENT_API}/${this.merchantId}/products/${id}`
    const res = await fetch(url, { method: "DELETE", headers: auth })
    // 404 = already gone — treat as success
    if (!res.ok && res.status !== 404) {
      const text = await res.text()
      throw new Error(`GMC delete failed ${res.status}: ${text}`)
    }
  }

  /**
   * List product statuses for error monitoring.
   * Returns items that have disapproval issues.
   */
  async listProductStatuses(maxResults = 500): Promise<{
    disapproved: { productId: string; title: string; issues: string[] }[]
    total: number
  }> {
    const auth = await this.authHeader()
    const url = `${CONTENT_API}/${this.merchantId}/productstatuses?maxResults=${maxResults}`
    const res = await fetch(url, { headers: auth })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GMC listStatuses failed ${res.status}: ${text}`)
    }
    const data = (await res.json()) as {
      resources?: {
        productId: string
        title?: string
        itemLevelIssues?: { description: string; servability: string }[]
      }[]
      totalMatchedCount?: string
    }

    const disapproved = (data.resources || [])
      .filter((r) => (r.itemLevelIssues || []).some((i) => i.servability === "disapproved"))
      .map((r) => ({
        productId: r.productId,
        title: r.title || r.productId,
        issues: (r.itemLevelIssues || [])
          .filter((i) => i.servability === "disapproved")
          .map((i) => i.description),
      }))

    return {
      disapproved,
      total: parseInt(data.totalMatchedCount || "0", 10),
    }
  }
}

// ─── Config reader ────────────────────────────────────────────────────────────

export interface GmcConfig {
  merchantId: string
  serviceAccountKey: string
  targetCountry: string
  feedLabel: string
  isConnected: boolean
}

/**
 * Read GMC config from store metadata integrations_config.
 * Returns null if not configured.
 */
export async function readGmcConfig(
  storeService: any
): Promise<GmcConfig | null> {
  try {
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.integrations_config
    if (!cfg) return null

    const gmcInteg = (cfg.integrations || []).find((i: any) => i.id === "gmc")
    if (!gmcInteg?.isConnected) return null

    const { merchantId = "", serviceAccountKey = "", targetCountry = "IN", feedLabel = "IN" } =
      gmcInteg.configFields || {}

    if (!merchantId || !serviceAccountKey) return null

    return { merchantId, serviceAccountKey, targetCountry, feedLabel, isConnected: true }
  } catch {
    return null
  }
}
