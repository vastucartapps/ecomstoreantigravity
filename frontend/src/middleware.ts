import { NextRequest, NextResponse } from "next/server"

// Fallback matches the docker-compose service alias (ecomstore-backend); the
// real value comes from MEDUSA_INTERNAL_URL env. A wrong fallback would silently
// 503 all proxied /store|/admin|/auth API calls if the env were ever missing.
const BACKEND_URL = process.env.MEDUSA_INTERNAL_URL || "http://ecomstore-backend:9000"

/**
 * Next.js middleware that:
 * 1. Routes API calls to the Medusa backend (proxy routing).
 * 2. Sets a `vc-region` cookie based on Cloudflare geo-IP for storefront pages.
 *    Cookie value: "india" (INR) or "international" (USD).
 *    Cart creation reads this cookie to select the correct Medusa region.
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

  // UCP discovery profile is served by the storefront itself (app router ignores
  // leading-dot folders, so we rewrite to a normal route). Must come BEFORE the
  // generic /.well-known/* → backend proxy below.
  if (pathname === "/.well-known/ucp") {
    return NextResponse.rewrite(new URL("/api/ucp" + search, request.url))
  }

  // Public GMC product feed rewrites for Google Merchant Center crawler
  if (
    pathname === "/gmc-feed" ||
    pathname === "/gmc-feed.xml" ||
    pathname === "/feed/gmc.xml"
  ) {
    return NextResponse.rewrite(new URL("/gmc-feed", BACKEND_URL))
  }

  // /store/*, /auth/*, /.well-known/*, /health — always proxy to backend
  // Exception: /auth/google/callback is a Next.js page (OAuth token landing),
  // not a backend route — let it render as a page.
  if (
    pathname.startsWith("/store/") ||
    (pathname.startsWith("/auth/") && pathname !== "/auth/google/callback") ||
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

  // Storefront page navigation — set geo-IP region cookie if not already set.
  // CF-IPCountry is a 2-letter ISO country code injected by Cloudflare on every
  // production request. In development/staging without Cloudflare the header is
  // absent and we default to "international" (USD). India visitors always see INR.
  const existingCookie = request.cookies.get("vc-region")
  if (!existingCookie) {
    const country = request.headers.get("cf-ipcountry") ?? ""
    const region = country.toUpperCase() === "IN" ? "india" : "international"
    const response = NextResponse.next()
    response.cookies.set("vc-region", region, {
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
      sameSite: "lax",
      // Not httpOnly — cart-provider.tsx reads this client-side via document.cookie
    })
    return response
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
    // Storefront pages — run middleware for geo-IP cookie detection.
    // Excludes Next.js internals (_next/static, _next/image) and favicon.
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
}
