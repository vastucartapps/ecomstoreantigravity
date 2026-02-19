import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const banner = await adsService.getBannerParsed(req.params.id)
    if (!banner) {
      res.status(404).json({ message: "Banner not found" })
      return
    }
    res.json({ banner })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to get banner" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.headline !== undefined) updates.headline = body.headline
    if (body.cta_text !== undefined) updates.cta_text = body.cta_text
    if (body.cta_url !== undefined) updates.cta_url = body.cta_url
    if (body.status !== undefined) updates.status = body.status
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.start_date !== undefined) updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.product_ids !== undefined)
      updates.product_ids_json = JSON.stringify(body.product_ids)
    if (body.product_names !== undefined)
      updates.product_names_json = JSON.stringify(body.product_names)
    if (body.creatives !== undefined)
      updates.creatives_json = JSON.stringify(body.creatives)

    await adsService.updateEcosystemBanners(req.params.id, updates)
    const banner = await adsService.getBannerParsed(req.params.id)
    res.json({ banner })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update banner" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const bannerId = req.params.id

    // Remove banner from any slots
    const slots = await adsService.listEcosystemSlots(
      { current_banner_id: bannerId },
      { take: 500 }
    )
    for (const slot of slots) {
      await adsService.updateEcosystemSlots(slot.id, {
        current_banner_id: null,
      })
    }

    await adsService.deleteEcosystemBanners(bannerId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete banner" })
  }
}
