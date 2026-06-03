import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../../modules/loyalty"
import type { ILoyaltyService } from "../../../../../lib/service-types"
import { isLoyaltyEnabled } from "../../../../../lib/loyalty-config"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  // Honour the system-wide admin toggle in real time: when disabled, report an
  // empty/zero state (not an error) so the storefront simply hides loyalty.
  if (!(await isLoyaltyEnabled(req.scope))) {
    res.json({ enabled: false, balance: 0, transactions: [] })
    return
  }

  const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as ILoyaltyService
  const balance = await loyaltyService.getBalance(customerId)
  const transactions = await loyaltyService.getTransactions(customerId)

  res.json({ enabled: true, balance, transactions })
}
