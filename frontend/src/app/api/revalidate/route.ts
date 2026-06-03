import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

/**
 * On-demand revalidation webhook (task #176).
 *
 * The Medusa backend calls this when the catalog changes (product/category
 * created/updated/deleted) so the storefront's ISR-cached surfaces refresh
 * within seconds instead of waiting out the time-based revalidate window.
 * (The sitemap itself is already dynamic/no-store, so it's always live.)
 *
 * Auth: shared secret in the `x-revalidate-secret` header, matched against
 * REVALIDATE_SECRET (must equal the backend's value). The fallback keeps it
 * working out-of-the-box; override via env on both services to harden.
 *
 * Body: { paths?: string[] } — each is revalidated as a page; we additionally
 * revalidate the root layout so the shared header-nav (categories) refreshes
 * everywhere. We use revalidatePath only — Next 16's revalidateTag is tied to
 * the "use cache" model and isn't the right tool for fetch-cached data here.
 */
const REVALIDATE_SECRET =
  process.env.REVALIDATE_SECRET || "vc-revalidate-2026-shared-secret-change-me"

export async function POST(req: NextRequest): Promise<NextResponse> {
  const provided = req.headers.get("x-revalidate-secret") || ""
  if (!REVALIDATE_SECRET || provided !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: { paths?: string[] } = {}
  try {
    body = (await req.json()) as { paths?: string[] }
  } catch {
    // empty body is allowed
  }

  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p) => typeof p === "string" && p.startsWith("/"))
    : []

  for (const path of paths) {
    // Specific content pages (product/category) — refresh the page.
    revalidatePath(path)
  }

  // Always refresh the root layout so the shared header-nav (category list,
  // fetched in the storefront layout) reflects catalog changes everywhere.
  revalidatePath("/", "layout")

  return NextResponse.json({ revalidated: true, paths })
}
