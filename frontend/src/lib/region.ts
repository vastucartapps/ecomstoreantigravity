const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

let cachedInrId: string | null = null
let cachedUsdId: string | null = null
let cacheInrTimestamp = 0
let cacheUsdTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches region IDs from Medusa, with separate per-currency in-memory caches.
 *
 * Pass preferInternational=true to get the USD region (for non-India visitors).
 * Default (false) returns the INR region (for India visitors).
 *
 * Falls back to the first available region if the requested currency is not found,
 * and falls back to stale cache on network errors rather than throwing.
 */
export async function getRegionId(preferInternational?: boolean): Promise<string> {
  const now = Date.now()

  if (preferInternational) {
    if (cachedUsdId && now - cacheUsdTimestamp < CACHE_TTL) return cachedUsdId
  } else {
    if (cachedInrId && now - cacheInrTimestamp < CACHE_TTL) return cachedInrId
  }

  const res = await fetch(`${BACKEND_URL}/store/regions`, {
    headers: { "x-publishable-api-key": PUB_KEY },
  })

  if (!res.ok) {
    // Return stale cache on error rather than throwing
    const stale = preferInternational ? cachedUsdId : cachedInrId
    if (stale) return stale
    throw new Error(`Failed to fetch regions: ${res.status}`)
  }

  const data = await res.json()
  const regions: { id: string; currency_code: string }[] = data.regions || []

  const inrRegion = regions.find((r) => r.currency_code === "inr")
  const usdRegion = regions.find((r) => r.currency_code === "usd")

  // Fall back to the first region if a specific currency is not found
  const inrId = inrRegion?.id || regions[0]?.id || ""
  const usdId = usdRegion?.id || regions[0]?.id || ""

  if (inrId) {
    cachedInrId = inrId
    cacheInrTimestamp = now
  }
  if (usdId) {
    cachedUsdId = usdId
    cacheUsdTimestamp = now
  }

  return preferInternational ? usdId : inrId
}

/**
 * Returns the region query param string (e.g. "&region_id=reg_xxx").
 * Returns empty string if no region found.
 */
export async function getRegionParam(preferInternational?: boolean): Promise<string> {
  const id = await getRegionId(preferInternational)
  return id ? `&region_id=${id}` : ""
}
