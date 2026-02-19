import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../../../modules/loyalty"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const { points } = req.body as { points: number }
  if (!points || points <= 0) {
    res.status(400).json({ message: "Invalid points amount" })
    return
  }

  const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
  const result = await loyaltyService.redeemPoints(customerId, points)

  if (!result.success) {
    res.status(400).json({ message: "Insufficient loyalty points" })
    return
  }

  res.json({ success: true, new_balance: result.newBalance, points_redeemed: points })
}
