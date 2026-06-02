/**
 * Google Search Console API — lightweight client.
 *
 * Covers: Sitemaps (submit/list), Search Analytics (query), and the
 * URL Inspection API (index status). Auth mirrors gmc-client.ts /
 * ga4-client.ts exactly: a service-account JSON key (base64-encoded)
 * stored in
 *   store.metadata.integrations_config.integrations[id="gsc"].configFields.serviceAccountKey
 *
 * JWT/OAuth2 service-account flow implemented with Node built-ins
 * (crypto + fetch) — no googleapis package.
 *
 * Usage:
 *   const client = new GscClient(siteUrl, serviceAccountKeyBase64)
 *   await client.submitSitemap(sitemapUrl)
 *   const sitemaps = await client.listSitemaps()
 *   const rows = await client.searchAnalyticsQuery({ days: 28 })
 *   const inspection = await client.inspectUrl(pageUrl)
 *
 * Scopes requested cover all three surfaces:
 *   webmasters           → sitemap submit (write) + search analytics
 *   webmasters.readonly  → URL Inspection API
 */

import { createSign } from "crypto"

const SEARCH_CONSOLE_V3 = "https://searchconsole.googleapis.com/webmasters/v3"
const URL_INSPECTION_V1 = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SCOPE = [
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ")
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

// Module-level token cache (keyed by client_email + scope)
const tokenCache = new Map<string, TokenCache>()

// ─── JWT signing ──────────────────────────────────────────────────────────────

function base64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf, "utf8") : buf
  return b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

async function getAccessToken(sa: ServiceAccountKey): Promise<string> {
  const cacheKey = `${sa.client_email}|gsc`
  const cached = tokenCache.get(cacheKey)
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
    throw new Error(`GSC token error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })
  return data.access_token
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SitemapEntry {
  path: string
  lastSubmitted?: string
  lastDownloaded?: string
  isPending?: boolean
  warnings?: string
  errors?: string
  contents?: { type: string; submitted: string; indexed?: string }[]
}

export interface SearchAnalyticsRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchAnalyticsResult {
  rows: SearchAnalyticsRow[]
  totals: { clicks: number; impressions: number; ctr: number; position: number }
}

export interface UrlInspectionResult {
  verdict?: string
  coverageState?: string
  robotsTxtState?: string
  indexingState?: string
  lastCrawlTime?: string
  pageFetchState?: string
  googleCanonical?: string
  userCanonical?: string
  referringUrls?: string[]
  crawledAs?: string
  raw?: unknown
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class GscClient {
  private siteUrl: string
  private sa: ServiceAccountKey

  constructor(siteUrl: string, serviceAccountKeyBase64: string) {
    this.siteUrl = siteUrl
    try {
      this.sa = JSON.parse(
        Buffer.from(serviceAccountKeyBase64, "base64").toString("utf-8")
      ) as ServiceAccountKey
    } catch {
      throw new Error("GSC: invalid serviceAccountKey — must be base64-encoded JSON")
    }
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await getAccessToken(this.sa)
    return { Authorization: `Bearer ${token}` }
  }

  private encodedSite(): string {
    return encodeURIComponent(this.siteUrl)
  }

  /**
   * Submit (or re-submit) a sitemap. PUT is idempotent — Google records the
   * sitemap URL for the property and (re)crawls it. Safe to call repeatedly.
   */
  async submitSitemap(sitemapUrl: string): Promise<void> {
    const auth = await this.authHeader()
    const url = `${SEARCH_CONSOLE_V3}/sites/${this.encodedSite()}/sitemaps/${encodeURIComponent(
      sitemapUrl
    )}`
    const res = await fetch(url, { method: "PUT", headers: auth })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GSC submitSitemap failed ${res.status}: ${text}`)
    }
  }

  /** List all sitemaps registered for the property. */
  async listSitemaps(): Promise<SitemapEntry[]> {
    const auth = await this.authHeader()
    const url = `${SEARCH_CONSOLE_V3}/sites/${this.encodedSite()}/sitemaps`
    const res = await fetch(url, { headers: auth })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GSC listSitemaps failed ${res.status}: ${text}`)
    }
    const data = (await res.json()) as { sitemap?: SitemapEntry[] }
    return data.sitemap || []
  }

  /**
   * Search Analytics query. Defaults to the last `days` days grouped by the
   * given dimensions. Note GSC data lags ~2-3 days, so the window ends 3 days
   * before "today" by default to avoid empty trailing rows.
   */
  async searchAnalyticsQuery(opts: {
    days?: number
    dimensions?: string[]
    rowLimit?: number
    startDate?: string
    endDate?: string
  } = {}): Promise<SearchAnalyticsResult> {
    const { days = 28, dimensions = ["query"], rowLimit = 25 } = opts

    // GSC data finalizes ~3 days late; end window 3 days back unless overridden.
    const end = opts.endDate ?? isoDaysAgo(3)
    const start = opts.startDate ?? isoDaysAgo(3 + days)

    const auth = await this.authHeader()
    const url = `${SEARCH_CONSOLE_V3}/sites/${this.encodedSite()}/searchAnalytics/query`
    const res = await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions, rowLimit }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GSC searchAnalytics failed ${res.status}: ${text}`)
    }
    const data = (await res.json()) as { rows?: SearchAnalyticsRow[] }
    const rows = data.rows || []

    // Derive totals from the returned rows (CTR/position averaged by weight).
    const totals = rows.reduce(
      (acc, r) => {
        acc.clicks += r.clicks
        acc.impressions += r.impressions
        return acc
      },
      { clicks: 0, impressions: 0, ctr: 0, position: 0 }
    )
    totals.ctr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0
    totals.position =
      rows.length > 0
        ? rows.reduce((s, r) => s + r.position * r.impressions, 0) /
          (totals.impressions || 1)
        : 0

    return { rows, totals }
  }

  /**
   * URL Inspection API — index status for a single page on this property.
   * siteUrl is passed alongside the inspected URL per the API contract.
   */
  async inspectUrl(pageUrl: string, languageCode = "en-US"): Promise<UrlInspectionResult> {
    const auth = await this.authHeader()
    const res = await fetch(URL_INSPECTION_V1, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        inspectionUrl: pageUrl,
        siteUrl: this.siteUrl,
        languageCode,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GSC inspectUrl failed ${res.status}: ${text}`)
    }
    const data = (await res.json()) as {
      inspectionResult?: {
        indexStatusResult?: Record<string, unknown>
      }
    }
    const idx = (data.inspectionResult?.indexStatusResult || {}) as Record<string, any>
    return {
      verdict: idx.verdict,
      coverageState: idx.coverageState,
      robotsTxtState: idx.robotsTxtState,
      indexingState: idx.indexingState,
      lastCrawlTime: idx.lastCrawlTime,
      pageFetchState: idx.pageFetchState,
      googleCanonical: idx.googleCanonical,
      userCanonical: idx.userCanonical,
      referringUrls: idx.referringUrls,
      crawledAs: idx.crawledAs,
      raw: data.inspectionResult,
    }
  }
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

// ─── Config reader ────────────────────────────────────────────────────────────

export interface GscConfig {
  siteUrl: string
  serviceAccountKey: string
  verificationToken: string
  isConnected: boolean
}

/**
 * Read GSC config from store metadata integrations_config.
 * Returns null if not configured (siteUrl + serviceAccountKey required).
 */
export async function readGscConfig(storeService: any): Promise<GscConfig | null> {
  try {
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.integrations_config
    if (!cfg) return null

    const gscInteg = (cfg.integrations || []).find((i: any) => i.id === "gsc")
    if (!gscInteg?.isConnected) return null

    const { siteUrl = "", serviceAccountKey = "", verificationToken = "" } =
      gscInteg.configFields || {}

    if (!siteUrl || !serviceAccountKey) return null

    return { siteUrl, serviceAccountKey, verificationToken, isConnected: true }
  } catch {
    return null
  }
}
