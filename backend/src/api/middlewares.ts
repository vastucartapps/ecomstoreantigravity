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

export default defineMiddlewares({
  routes: [
    // ─── Admin authentication guard ──────────────────────────────────────────
    // Applies to ALL custom /admin/* routes. Medusa built-in admin routes
    // are already protected by the framework; this ensures our custom routes
    // require a valid admin session or bearer token too.
    {
      matcher: "/admin/*",
      middlewares: [authenticate("admin", ["bearer", "session"])],
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
