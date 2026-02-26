import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { GIFT_CARDS_MODULE } from "../../../../../modules/gift-cards"

/**
 * GET /store/customers/me/gift-cards
 *
 * Returns all gift cards owned by the authenticated customer.
 * Includes both self-purchased and received gifts.
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const service = req.scope.resolve(GIFT_CARDS_MODULE) as any

  const [gcs] = await service.listAndCountGiftCards(
    { customer_id: customerId },
    { order: { created_at: "DESC" }, take: 50 }
  ).catch(() => [[], 0])

  const now = new Date()
  const cards = (gcs as any[]).map((gc) => {
    const expired = gc.ends_at ? new Date(gc.ends_at) < now : false
    const depleted = gc.balance <= 0
    const status: string = gc.is_disabled ? "inactive" : expired ? "expired" : depleted ? "depleted" : "active"
    return {
      id: gc.id,
      code: gc.code,
      balance: gc.balance,
      value: gc.value,
      currency_code: gc.currency_code,
      status,
      ends_at: gc.ends_at,
      created_at: gc.created_at,
      recipient_name: gc.recipient_name,
      recipient_email: gc.recipient_email,
    }
  })

  res.json({ gift_cards: cards })
}
