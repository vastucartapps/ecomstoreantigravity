import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    if (!body.site_id || !body.name || !body.ratio) {
      res.status(400).json({ message: "site_id, name, and ratio are required" })
      return
    }

    const slot = await adsService.createEcosystemSlots({
      site_id: body.site_id,
      name: body.name,
      ratio: body.ratio,
      is_active: body.is_active ?? true,
      current_banner_id: null,
    })

    res.status(201).json({ slot })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create slot" })
  }
}
