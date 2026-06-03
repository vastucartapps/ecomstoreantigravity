/**
 * Serves the IndexNow key file at /indexnow-key.txt.
 *
 * The key lives in the admin system (store.metadata.seo_runtime, auto-generated
 * by the backend) — NOT an env var or hardcoded default. We fetch it from the
 * backend's public /store/seo-runtime route at request time. IndexNow verifies
 * ownership by fetching this file and matching the key the backend submits.
 */
const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function GET(): Promise<Response> {
  let key = ""
  try {
    const res = await fetch(`${BACKEND_URL}/store/seo-runtime`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      next: { revalidate: 3600 },
    })
    if (res.ok) key = (await res.json())?.indexnowKey || ""
  } catch {
    // fall through — empty body
  }

  return new Response(key, {
    status: key ? 200 : 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Robots-Tag": "noindex",
    },
  })
}
