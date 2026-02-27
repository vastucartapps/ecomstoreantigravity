import { defineMiddlewares, validateAndTransformBody, authenticate } from "@medusajs/framework/http"
import { SearchSchema } from "./store/products/search/route"
import rateLimit from "express-rate-limit"

// ─── Rate limiters for public write endpoints ─────────────────────────────────
// These protect high-abuse surfaces: newsletter, reviews, promo validation,
// tracking pixel, and loyalty redemption.

const strictLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) => process.env.NODE_ENV === "test",
})

const reviewLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many reviews submitted. Please try again later." },
  skip: (req) => process.env.NODE_ENV === "test",
})

const trackingLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many tracking requests." },
  skip: (req) => process.env.NODE_ENV === "test",
})

// ─── X-API-Version header middleware ─────────────────────────────────────────
// Documents the Medusa API version this backend targets. Used by API clients
// to detect version mismatches without parsing /health endpoints.
function setApiVersion(
  _req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  res.setHeader("X-API-Version", "2025-01-01")
  next()
}

// ─── Google OAuth callback → frontend redirect ────────────────────────────────
// Medusa returns {"token":"..."} as JSON from /auth/customer/google/callback.
// This middleware intercepts that response and redirects the browser to the
// frontend callback page with the token as a query param, instead of showing
// raw JSON in the browser.
function googleOAuthRedirect(
  _req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction
) {
  const originalJson = res.json.bind(res)
  ;(res as any).json = function (data: any) {
    if (data?.token && typeof data.token === "string" && !data.errors) {
      const frontendUrl =
        process.env.STORE_CORS?.split(",")[0]?.trim() ||
        "https://store.vastucart.in"
      res.json = originalJson // restore before redirect to avoid recursion
      return res.redirect(
        303,
        `${frontendUrl}/auth/google/callback?token=${encodeURIComponent(data.token)}`
      )
    }
    return originalJson(data)
  }
  next()
}

export default defineMiddlewares({
  routes: [
    // ─── API version header on all routes ────────────────────────────────────
    {
      matcher: "/**",
      middlewares: [setApiVersion],
    },

    // ─── Google OAuth: redirect browser to frontend instead of showing JSON ───
    {
      matcher: "/auth/customer/google/callback",
      middlewares: [googleOAuthRedirect],
    },

    // ─── Admin authentication guard ──────────────────────────────────────────
    // actor_type in Medusa v2 is "user" (not "admin") for admin panel users.
    // Using "admin" here caused every admin JWT to be rejected with 401.
    {
      matcher: "/admin/*",
      middlewares: [authenticate("user", ["bearer", "session", "api-key"])],
    },

    // ─── Rate limiting on public write endpoints ──────────────────────────────
    {
      matcher: "/store/newsletter",
      method: ["POST"],
      middlewares: [strictLimit as any],
    },
    {
      matcher: "/store/products/:id/reviews",
      method: ["POST"],
      middlewares: [reviewLimit as any],
    },
    {
      matcher: "/store/promotions/validate",
      method: ["POST"],
      middlewares: [strictLimit as any],
    },
    {
      matcher: "/store/customers/me/loyalty/redeem",
      method: ["POST"],
      middlewares: [strictLimit as any],
    },
    {
      matcher: "/store/ecosystem-banners/track",
      method: ["POST"],
      middlewares: [trackingLimit as any],
    },

    // ─── Store search body validation ─────────────────────────────────────────
    {
      matcher: "/store/products/search",
      method: ["POST"],
      middlewares: [validateAndTransformBody(SearchSchema)],
    },
  ],
})
