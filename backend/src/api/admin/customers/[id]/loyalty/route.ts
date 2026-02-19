import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { LOYALTY_MODULE } from "../../../../../modules/loyalty"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
  const points = await loyaltyService.getBalance(id)
  res.json({ points })
}
