import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ABANDONED_CART_RECOVERY_MODULE } from "../../../../../modules/abandoned-cart-recovery"

/**
 * Resolve a recovery token to a cart_id — called by the storefront
 * /cart/recover/[token] page which then sets the cart cookie.
 *
 * Token lookups that don't exist (or point to a completed / deleted cart)
 * return 404 so the storefront can show a graceful "cart expired" message.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const token = String(req.params?.token || "")
    if (!token) return res.status(400).json({ error: "token required" })

    const service = req.scope.resolve(ABANDONED_CART_RECOVERY_MODULE) as any
    const row = await service.findByToken(token)
    if (!row) return res.status(404).json({ error: "Recovery link not found" })

    if (row.recovered_at) {
      return res.status(410).json({ error: "This cart has already been recovered" })
    }

    res.json({
      cart_id: row.cart_id,
      discount_code: row.discount_code || null,
      stage: row.stage,
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Recovery lookup failed" })
  }
}
