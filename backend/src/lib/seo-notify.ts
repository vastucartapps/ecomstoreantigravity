/**
 * SEO freshness notifications — fired when the catalog changes so the
 * storefront's cached surfaces and search-engine indexes reflect the live
 * catalog within seconds (real-time), not on a time-based ISR window.
 *
 * Two channels, both env-secret-free:
 *  1. revalidateStorefront() → POSTs the frontend's /api/revalidate webhook
 *     over the INTERNAL docker network (STORE_INTERNAL_URL). The webhook is
 *     secured by network isolation (it rejects proxied/external requests), so
 *     there is no shared secret to configure or leak.
 *  2. pingIndexNow() → submits changed URLs to IndexNow (Bing/Yandex/Naver/
 *     Seznam) using the key from store.metadata (admin system, auto-generated).
 *     Google gets freshness from the dynamic sitemap + the GMC feed.
 *
 * Both fail soft: a notification error must never break the catalog write that
 * triggered it.
 *
 * STORE_URL / STORE_INTERNAL_URL are docker service-discovery infra (like
 * MEDUSA_INTERNAL_URL), not config/secrets.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

type Logger = { info?: (m: string) => void; warn?: (m: string) => void }

export function storefrontUrl(): string {
  return (process.env.STORE_URL || "https://store.vastucart.in").replace(/\/$/, "")
}

/** Internal docker URL for the storefront (no Traefik/CF in front). */
function storefrontInternalUrl(): string {
  return (process.env.STORE_INTERNAL_URL || "http://ecomstore-frontend:3000").replace(/\/$/, "")
}

/** Submit changed URLs to IndexNow. No-op on empty list/key; never throws. */
export async function pingIndexNow(
  urls: string[],
  indexnowKey: string,
  logger?: Logger
): Promise<void> {
  const list = Array.from(new Set(urls.filter(Boolean)))
  if (!list.length || !indexnowKey) return
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
        key: indexnowKey,
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

/**
 * Trigger Next.js on-demand revalidation of the given paths over the internal
 * network. No secret — the frontend route authenticates by network isolation.
 * Never throws.
 */
export async function revalidateStorefront(
  paths: string[],
  logger?: Logger
): Promise<void> {
  const list = Array.from(new Set(paths.filter(Boolean)))
  if (!list.length) return
  try {
    const res = await fetch(`${storefrontInternalUrl()}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: list }),
    })
    if (!res.ok) {
      logger?.warn?.(`[seo-notify] revalidate webhook HTTP ${res.status}`)
    }
  } catch (err: any) {
    logger?.warn?.(`[seo-notify] revalidate webhook failed: ${err?.message}`)
  }
}
