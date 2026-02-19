import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const site = await adsService.retrieveEcosystemSite(req.params.id)
    if (!site) {
      res.status(404).json({ message: "Site not found" })
      return
    }

    await adsService.updateEcosystemSites(req.params.id, {
      is_active: !site.is_active,
    })

    res.json({ is_active: !site.is_active })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to toggle site" })
  }
}
