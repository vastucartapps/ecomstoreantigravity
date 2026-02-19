import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const banners = await adsService.listBannersWithStats()
    res.json({ banners })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list banners" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    const banner = await adsService.createEcosystemBanners({
      name: body.name || "",
      headline: body.headline || "",
      cta_text: body.cta_text || "",
      cta_url: body.cta_url || "",
      status: body.status || "draft",
      is_active: body.is_active ?? false,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      priority: body.priority ?? 1,
      product_ids_json: JSON.stringify(body.product_ids || []),
      product_names_json: JSON.stringify(body.product_names || []),
      creatives_json: JSON.stringify(body.creatives || []),
    })

    res.status(201).json({ banner })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create banner" })
  }
}
