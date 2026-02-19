import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_INTERNAL_URL || "http://backend:9000"

/**
 * Next.js middleware that routes API calls to the Medusa backend.
 *
 * Problem: Next.js page routes at /admin/* intercept ALL requests including
 * API calls (POST /admin/products → 405, GET /admin/products with auth → HTML).
 * Standard rewrites (afterFiles) can't fix this because page routes take priority.
 *
 * Solution: Middleware runs BEFORE page routing and can distinguish:
 * - Page navigation: GET, no Authorization header → serve Next.js page
 * - API call: non-GET method OR has Authorization header → proxy to backend
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // /store/*, /auth/*, /.well-known/*, /health — always proxy to backend
  // (no Next.js pages exist at these paths)
  if (
    pathname.startsWith("/store/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/health"
  ) {
    return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL))
  }

  // /admin/* — smart routing based on request characteristics
  if (pathname.startsWith("/admin")) {
    // Non-GET requests (POST, PUT, DELETE) are always API calls
    if (request.method !== "GET") {
      return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL))
    }

    // GET with Authorization header = SDK API data fetch (not page navigation)
    if (request.headers.has("authorization")) {
      return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL))
    }

    // GET with x-publishable-api-key = store API call
    if (request.headers.has("x-publishable-api-key")) {
      return NextResponse.rewrite(new URL(pathname + search, BACKEND_URL))
    }

    // GET without auth = regular page navigation → let Next.js serve the page
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/store/:path*",
    "/auth/:path*",
    "/health",
    "/.well-known/:path*",
  ],
}
