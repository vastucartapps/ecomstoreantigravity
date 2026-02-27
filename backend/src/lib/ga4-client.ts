/**
 * Google Analytics 4 Data API — lightweight client.
 *
 * Auth: Service Account JSON key (base64-encoded) stored in
 *   store.metadata.integrations_config.integrations[id="ga4"].configFields.serviceAccountKey
 *
 * Implements JWT/OAuth2 service-account flow entirely with Node.js built-ins
 * (crypto + fetch) — no googleapis package needed.
 *
 * GA4 Data API v1beta: runReport endpoint
 * Scope: https://www.googleapis.com/auth/analytics.readonly
 */

import { createSign } from "crypto"

const DATA_API_BASE = "https://analyticsdata.googleapis.com/v1beta"
const TOKEN_URL = "https://oauth2.googleapis.com/token"
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly"
const TOKEN_TTL_MS = 55 * 60 * 1000 // 55 min

interface ServiceAccountKey {
  client_email: string
  private_key: string
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
    throw new Error(`GA4 token error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache.set(sa.client_email, {
    token: data.access_token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  })
  return data.access_token
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GA4MetricRow {
  dimension: string
  value: number
}

export interface GA4Report {
  totals: {
    sessions: number
    users: number
    pageviews: number
    eventCount: number
    newUsers: number
    engagementRate: number
  }
  topPages: { page: string; sessions: number }[]
  deviceBreakdown: { device: string; sessions: number }[]
  trafficSources: { channel: string; sessions: number }[]
  dateRange: { startDate: string; endDate: string }
  propertyId: string
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class GA4Client {
  private propertyId: string
  private sa: ServiceAccountKey

  constructor(propertyId: string, serviceAccountKeyBase64: string) {
    this.propertyId = propertyId
    try {
      this.sa = JSON.parse(
        Buffer.from(serviceAccountKeyBase64, "base64").toString("utf-8")
      ) as ServiceAccountKey
    } catch {
      throw new Error("GA4: invalid serviceAccountKey — must be base64-encoded JSON")
    }
  }

  private async authHeader(): Promise<Record<string, string>> {
    const token = await getAccessToken(this.sa)
    return { Authorization: `Bearer ${token}` }
  }

  /**
   * Run a GA4 Data API report.
   * Returns totals (sessions/users/pageviews/events), top pages, and device breakdown
   * for the given date range (defaults to last 30 days).
   */
  async runReport(daysBack = 30): Promise<GA4Report> {
    const auth = await this.authHeader()

    // Normalize propertyId — strip "properties/" prefix if user typed it plain
    const pid = this.propertyId.startsWith("properties/")
      ? this.propertyId
      : `properties/${this.propertyId}`

    const url = `${DATA_API_BASE}/${pid}:runReport`

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    const fmt = (d: Date) => d.toISOString().split("T")[0]

    const dateRange = {
      startDate: fmt(startDate),
      endDate: fmt(endDate),
    }

    // ── 1. Totals ──────────────────────────────────────────────
    const totalsRes = await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [dateRange],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "eventCount" },
          { name: "newUsers" },
          { name: "engagementRate" },
        ],
      }),
    })

    if (!totalsRes.ok) {
      const text = await totalsRes.text()
      throw new Error(`GA4 runReport (totals) failed ${totalsRes.status}: ${text}`)
    }

    const totalsData = (await totalsRes.json()) as {
      rows?: { metricValues: { value: string }[] }[]
    }
    const totalsRow = totalsData.rows?.[0]?.metricValues || []
    const totals = {
      sessions: parseInt(totalsRow[0]?.value || "0", 10),
      users: parseInt(totalsRow[1]?.value || "0", 10),
      pageviews: parseInt(totalsRow[2]?.value || "0", 10),
      eventCount: parseInt(totalsRow[3]?.value || "0", 10),
      newUsers: parseInt(totalsRow[4]?.value || "0", 10),
      engagementRate: parseFloat(totalsRow[5]?.value || "0"),
    }

    // ── 2. Top pages (by sessions) ─────────────────────────────
    const pagesRes = await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [dateRange],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 10,
      }),
    })

    if (!pagesRes.ok) {
      const text = await pagesRes.text()
      throw new Error(`GA4 runReport (pages) failed ${pagesRes.status}: ${text}`)
    }

    const pagesData = (await pagesRes.json()) as {
      rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
    }
    const topPages = (pagesData.rows || []).map((r) => ({
      page: r.dimensionValues[0]?.value || "/",
      sessions: parseInt(r.metricValues[0]?.value || "0", 10),
    }))

    // ── 3. Device breakdown ────────────────────────────────────
    const devicesRes = await fetch(url, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        dateRanges: [dateRange],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      }),
    })

    if (!devicesRes.ok) {
      const text = await devicesRes.text()
      throw new Error(`GA4 runReport (devices) failed ${devicesRes.status}: ${text}`)
    }

    const devicesData = (await devicesRes.json()) as {
      rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
    }
    const deviceBreakdown = (devicesData.rows || []).map((r) => ({
      device: r.dimensionValues[0]?.value || "unknown",
      sessions: parseInt(r.metricValues[0]?.value || "0", 10),
    }))

    // ── 4. Traffic sources (channel groups) ────────────────────
    let trafficSources: { channel: string; sessions: number }[] = []
    try {
      const sourcesRes = await fetch(url, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [dateRange],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [{ name: "sessions" }],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: 8,
        }),
      })
      if (sourcesRes.ok) {
        const sourcesData = (await sourcesRes.json()) as {
          rows?: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }[]
        }
        trafficSources = (sourcesData.rows || []).map((r) => ({
          channel: r.dimensionValues[0]?.value || "Unknown",
          sessions: parseInt(r.metricValues[0]?.value || "0", 10),
        }))
      }
    } catch {
      // Non-fatal — dashboard shows what it can
    }

    return { totals, topPages, deviceBreakdown, trafficSources, dateRange, propertyId: pid }
  }
}

// ─── Config reader ────────────────────────────────────────────────────────────

export interface GA4Config {
  propertyId: string
  measurementId: string
  serviceAccountKey: string
  isConnected: boolean
}

/**
 * Read GA4 config from store metadata integrations_config.
 * Returns null if not configured.
 */
export async function readGA4Config(
  storeService: any
): Promise<GA4Config | null> {
  try {
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.integrations_config
    if (!cfg) return null

    const ga4Integ = (cfg.integrations || []).find((i: any) => i.id === "ga4")
    if (!ga4Integ?.isConnected) return null

    const { propertyId = "", measurementId = "", serviceAccountKey = "" } =
      ga4Integ.configFields || {}

    if (!propertyId || !serviceAccountKey) return null

    return { propertyId, measurementId, serviceAccountKey, isConnected: true }
  } catch {
    return null
  }
}
