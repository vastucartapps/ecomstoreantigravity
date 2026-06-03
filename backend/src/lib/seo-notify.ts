/**
 * SEO freshness notifications — fired when the catalog changes so the
 * storefront's cached surfaces and search-engine indexes reflect the live
 * catalog within seconds (not on a time-based ISR window).
 *
 * Two channels:
 *  1. revalidateStorefront() → POSTs the frontend's /api/revalidate webhook
 *     (shared secret) so Next.js revalidates the affected product/category
 *     pages + the nav tag. The sitemap itself is already dynamic (no-store).
 *  2. pingIndexNow() → submits changed URLs to IndexNow (Bing, Yandex, Naver,
 *     Seznam; Google reads sitemap lastmod + the GMC feed instead). IndexNow is
 *     the COMPLIANT fast-index path — Google's Indexing API is JobPosting/
 *     BroadcastEvent-only and must NOT be used for products.
 *
 * Both fail soft: a notification error must never break the catalog write that
 * triggered it.
 */

// IndexNow key is hosted by the frontend at /indexnow-key.txt and referenced
// via keyLocation. The same value must be served there — keep the fallback in
// sync with frontend/src/app/indexnow-key.txt/route.ts (override via env on
// both services for production hardening).
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "a7f3c9e1b2d84056f1a9c3e7b5d20486"
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

// Shared secret authenticating the backend → frontend revalidate webhook.
// Override via REVALIDATE_SECRET env on BOTH services in production.
const REVALIDATE_SECRET =
  process.env.REVALIDATE_SECRET || "vc-revalidate-2026-shared-secret-change-me"

type Logger = { info?: (m: string) => void; warn?: (m: string) => void }

export function storefrontUrl(): string {
  return (process.env.STORE_URL || "https://store.vastucart.in").replace(/\/$/, "")
}

/** Submit changed URLs to IndexNow. No-op on empty list; never throws. */
export async function pingIndexNow(urls: string[], logger?: Logger): Promise<void> {
  const list = Array.from(new Set(urls.filter(Boolean)))
  if (!list.length) return
  const site = storefrontUrl()
  let host: string
  try {
    host = new URL(site).host
  } catch {
    return
  }
  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${site}/indexnow-key.txt`,
        urlList: list,
      }),
    })
    if (!res.ok) {
      logger?.warn?.(`[seo-notify] IndexNow HTTP ${res.status} for ${list.length} url(s)`)
    }
  } catch (err: any) {
    logger?.warn?.(`[seo-notify] IndexNow ping failed: ${err?.message}`)
  }
}

/** Trigger Next.js on-demand revalidation of the given paths/tags. Never throws. */
export async function revalidateStorefront(
  payload: { paths?: string[]; tags?: string[] },
  logger?: Logger
): Promise<void> {
  if (!payload.paths?.length && !payload.tags?.length) return
  try {
    const res = await fetch(`${storefrontUrl()}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      logger?.warn?.(`[seo-notify] revalidate webhook HTTP ${res.status}`)
    }
  } catch (err: any) {
    logger?.warn?.(`[seo-notify] revalidate webhook failed: ${err?.message}`)
  }
}
