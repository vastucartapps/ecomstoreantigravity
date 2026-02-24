import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const banner = await adsService.retrieveEcosystemBanner(req.params.id)
    if (!banner) {
      res.status(404).json({ message: "Banner not found" })
      return
    }

    await adsService.updateEcosystemBanners({ id: req.params.id, is_active: !banner.is_active })

    res.json({ is_active: !banner.is_active })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to toggle banner" })
  }
}
