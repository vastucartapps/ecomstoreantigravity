import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../../modules/loyalty"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
  const balance = await loyaltyService.getBalance(customerId)
  const transactions = await loyaltyService.getTransactions(customerId)

  res.json({ balance, transactions })
}
