import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    const { banner_id, site_id, slot_id, event_type } = body

    if (!banner_id || !site_id || !slot_id || !event_type) {
      res.status(400).json({
        message: "banner_id, site_id, slot_id, and event_type are required",
      })
      return
    }

    if (!["impression", "click"].includes(event_type)) {
      res.status(400).json({ message: "event_type must be 'impression' or 'click'" })
      return
    }

    await adsService.trackEvent(banner_id, site_id, slot_id, event_type)

    // Lightweight response for tracking pixels
    res.json({ success: true })
  } catch (err: any) {
    // Don't fail tracking requests — degrade gracefully
    res.json({ success: false })
  }
}
