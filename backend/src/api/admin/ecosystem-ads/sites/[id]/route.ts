import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    const updates: any = {}
    if (body.subdomain !== undefined) updates.subdomain = body.subdomain
    if (body.display_name !== undefined) updates.display_name = body.display_name
    if (body.is_active !== undefined) updates.is_active = body.is_active

    await adsService.updateEcosystemSites(req.params.id, updates)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update site" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const siteId = req.params.id

    // Cascade delete slots for this site
    const slots = await adsService.listEcosystemSlots(
      { site_id: siteId },
      { take: 500 }
    )
    for (const slot of slots) {
      await adsService.deleteEcosystemSlots(slot.id)
    }

    await adsService.deleteEcosystemSites(siteId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete site" })
  }
}
