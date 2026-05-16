import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../modules/marketing-slides"
import { captureException } from "../../../lib/error-reporter"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
    const [slides, count] =
      await marketingSlidesService.listAndCountMarketingSlides(
        {},
        { order: { display_order: "ASC" } }
      )
    res.json({ marketing_slides: slides, count })
  } catch (err) {
    captureException(err, { source: "api/admin/marketing-slides:GET" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to list marketing slides",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
    const slide = await marketingSlidesService.createMarketingSlides(req.body)
    res.status(201).json({ marketing_slide: slide })
  } catch (err) {
    captureException(err, { source: "api/admin/marketing-slides:POST" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to create marketing slide",
    })
  }
}
