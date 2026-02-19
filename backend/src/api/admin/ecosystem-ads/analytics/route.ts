import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const period = (req.query.period as string) || undefined
    const result = await adsService.getAnalytics(period)
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to get analytics" })
  }
}
