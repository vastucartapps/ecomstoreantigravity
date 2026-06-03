/**
 * UCP (Universal Commerce Protocol) discovery profile.
 *
 * Served at /.well-known/ucp (middleware rewrites that path here, because the
 * Next app router ignores leading-dot folders and otherwise proxies
 * /.well-known/* to the backend). This is the discovery file Google's agentic
 * shopping (Universal Cart / AI Mode) + other UCP agents read to learn that the
 * merchant is UCP-aware and where its product catalogue lives.
 *
 * SCOPE (deliberate, honest readiness — see task #167):
 *  - Declares profile version, merchant identity, and product-discovery via the
 *    live GMC product feed (the confirmed feed-first eligibility lever).
 *  - Publishes signing_keys from env (UCP_SIGNING_PUBLIC_JWK) when provisioned.
 *  - Does NOT advertise a live checkout endpoint — UCP checkout is US/CA/AU
 *    select-merchant only and India-ineligible as of 2026-06; adding the
 *    checkout service block + REST handlers is a one-file follow-up when Google
 *    confirms India eligibility / the spec reaches GA. No false capability.
 */
const UCP_VERSION = "2026-04-08"
const STORE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in").replace(/\/$/, "")
const FEED_URL =
  (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in").replace(/\/$/, "") +
  "/store/gmc-feed"

function signingKeys(): unknown[] {
  const raw = process.env.UCP_SIGNING_PUBLIC_JWK
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return []
  }
}

export async function GET(): Promise<Response> {
  const profile = {
    ucp: {
      version: UCP_VERSION,
      capabilities: ["dev.ucp.common.identity_linking", "dev.ucp.shopping.discovery"],
      services: {
        "dev.ucp.shopping": {
          version: UCP_VERSION,
          transport: "rest",
          catalog: {
            // Live, complete product feed — the primary AI-shopping input.
            product_feed: FEED_URL,
            format: "google-merchant-rss",
          },
        },
      },
    },
    signing_keys: signingKeys(),
    merchant: {
      name: "VastuCart",
      url: STORE_URL,
    },
  }

  return new Response(JSON.stringify(profile, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  })
}
