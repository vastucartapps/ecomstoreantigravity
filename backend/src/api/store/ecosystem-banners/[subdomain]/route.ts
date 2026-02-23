import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const subdomain = req.params.subdomain

    const { site_id, banners } = await adsService.getBannersForSite(subdomain)

    // Set cache headers for ecosystem sites
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60")
    // site_id is included so partner sites can use it for tracking calls
    res.json({ site_id, banners })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to get banners" })
  }
}
