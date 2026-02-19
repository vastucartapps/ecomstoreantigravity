const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

let cachedRegionId: string | null = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches the INR region ID from Medusa, with in-memory caching.
 * Falls back to the first available region if no INR region exists.
 */
export async function getRegionId(): Promise<string> {
  const now = Date.now()
  if (cachedRegionId && now - cacheTimestamp < CACHE_TTL) {
    return cachedRegionId
  }

  const res = await fetch(`${BACKEND_URL}/store/regions`, {
    headers: { "x-publishable-api-key": PUB_KEY },
  })
  if (!res.ok) {
    if (cachedRegionId) return cachedRegionId
    throw new Error(`Failed to fetch regions: ${res.status}`)
  }

  const data = await res.json()
  const regions = data.regions || []

  const inrRegion = regions.find(
    (r: { currency_code: string }) => r.currency_code === "inr"
  )
  const regionId = inrRegion?.id || regions[0]?.id || ""

  if (regionId) {
    cachedRegionId = regionId
    cacheTimestamp = now
  }

  return regionId
}

/**
 * Returns the region query param string (e.g. "&region_id=reg_xxx").
 * Returns empty string if no region found.
 */
export async function getRegionParam(): Promise<string> {
  const id = await getRegionId()
  return id ? `&region_id=${id}` : ""
}
