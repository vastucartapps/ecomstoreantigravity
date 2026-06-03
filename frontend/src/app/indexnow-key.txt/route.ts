/**
 * Serves the IndexNow key file at /indexnow-key.txt.
 *
 * IndexNow (Bing, Yandex, Naver, Seznam) verifies ownership by fetching this
 * file and confirming it contains the key submitted in the ping. The backend's
 * seo-notify lib references this exact URL via `keyLocation`. The key value
 * MUST match backend/src/lib/seo-notify.ts (override via INDEXNOW_KEY env on
 * both services to rotate).
 */
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "a7f3c9e1b2d84056f1a9c3e7b5d20486"

export async function GET(): Promise<Response> {
  return new Response(INDEXNOW_KEY, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
      // Not useful in search results itself.
      "X-Robots-Tag": "noindex",
    },
  })
}
