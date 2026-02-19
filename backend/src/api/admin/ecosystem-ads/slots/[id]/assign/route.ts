import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../../modules/ecosystem-ads"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    if (!body.banner_id) {
      res.status(400).json({ message: "banner_id is required" })
      return
    }

    const result = await adsService.assignSlot(req.params.id, body.banner_id)
    if (!result.success) {
      res.status(400).json({ message: result.error })
      return
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to assign slot" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    await adsService.removeSlotAssignment(req.params.id)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to remove assignment" })
  }
}
