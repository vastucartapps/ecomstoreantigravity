import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /store/promotions/validate?code=CODE&cart_id=CART_ID
 *
 * Validates a promotion code against customer-eligibility rules stored in
 * the promotion's metadata. Currently supports:
 *
 *   metadata.customer_eligibility = "new_customers"
 *     → Rejects the coupon if the customer already has placed orders.
 *
 * Customer identity resolution (in order of priority):
 *   1. req.auth_context.actor_id — set when customer JWT cookie is present
 *   2. cart.customer_id — fallback via cart_id query param
 *   3. Neither → treat as guest → valid for new_customers coupons
 *
 * Returns:
 *   { valid: true }
 *   { valid: false, reason: "..." }
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = (req.query?.code as string | undefined)?.trim()
  if (!code) {
    return res.status(400).json({ message: "code query param is required" })
  }

  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)

    const [promotions] = await promotionService.listAndCountPromotions(
      { code: code.toUpperCase() },
      { select: ["id", "code", "status", "metadata"] }
    )

    const promotion = promotions?.[0]
    if (!promotion || promotion.status === "inactive") {
      return res.json({ valid: true }) // Unknown/inactive — let Medusa's engine decide
    }

    const meta = (promotion as any).metadata || {}
    const eligibility: string = meta.customer_eligibility || "all"

    if (eligibility === "all") {
      return res.json({ valid: true })
    }

    if (eligibility === "new_customers") {
      // Resolve customer ID: JWT session first, then cart lookup
      let customerId: string | null = (req.auth_context as any)?.actor_id || null

      if (!customerId) {
        const cartId = (req.query?.cart_id as string | undefined)?.trim()
        if (cartId) {
          try {
            const cartService = req.scope.resolve(Modules.CART)
            const cart = await cartService.retrieveCart(cartId, { select: ["customer_id"] })
            customerId = (cart as any).customer_id || null
          } catch {
            // Cart not found — treat as guest
          }
        }
      }

      if (!customerId) {
        // Guest checkout — valid (no prior orders possible)
        return res.json({ valid: true })
      }

      const orderService = req.scope.resolve(Modules.ORDER)
      const [orders] = await orderService.listAndCountOrders(
        { customer_id: customerId, status: ["pending", "completed"] },
        { select: ["id"], take: 1 }
      )

      if (orders.length > 0) {
        return res.json({
          valid: false,
          reason: "This coupon is for first-time customers only.",
        })
      }

      return res.json({ valid: true })
    }

    return res.json({ valid: true })
  } catch {
    // Fail-open: any unexpected error allows the coupon through
    return res.json({ valid: true })
  }
}
