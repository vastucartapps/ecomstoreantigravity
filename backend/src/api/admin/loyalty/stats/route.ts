import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { LOYALTY_MODULE } from "../../../../modules/loyalty"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const loyaltyService = req.scope.resolve(LOYALTY_MODULE) as any
    const stats = await loyaltyService.getStats()
    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch loyalty stats" })
  }
}
