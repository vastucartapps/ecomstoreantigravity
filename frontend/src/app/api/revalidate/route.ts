import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * On-demand revalidation webhook (task #176) — real-time storefront refresh
 * when the catalog changes.
 *
 * AUTH BY NETWORK ISOLATION (no secret, no env):
 * The Medusa backend calls this over the internal docker network
 * (http://ecomstore-frontend:3000/api/revalidate), which hits this container
 * directly — NOT through Cloudflare/Traefik. Any external request to
 * https://store.vastucart.in/api/revalidate is proxied and therefore carries
 * x-forwarded-for / x-forwarded-host (and cf-* in prod). We reject anything
 * bearing those proxy headers, so only internal callers can trigger it.
 *
 * Body: { paths?: string[] } — each revalidated as a page; we also revalidate
 * the root layout so the shared header-nav refreshes everywhere.
 */
function isInternalRequest(req: NextRequest): boolean {
  // Proxied (external) requests always carry these; internal docker requests
  // straight to :3000 do not.
  const proxied =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-forwarded-host") ||
    req.headers.get("cf-ray") ||
    req.headers.get("cf-connecting-ip")
  return !proxied
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isInternalRequest(req)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }

  let body: { paths?: string[] } = {}
  try {
    body = (await req.json()) as { paths?: string[] }
  } catch {
    // empty body allowed
  }

  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p) => typeof p === "string" && p.startsWith("/"))
    : []

  for (const path of paths) revalidatePath(path)
  // Refresh the root layout so the shared header-nav (categories) updates too.
  revalidatePath("/", "layout")

  return NextResponse.json({ revalidated: true, paths })
}
