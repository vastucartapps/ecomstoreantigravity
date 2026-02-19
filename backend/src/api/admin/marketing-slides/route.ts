import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../modules/marketing-slides"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any

  const [slides, count] =
    await marketingSlidesService.listAndCountMarketingSlides(
      {},
      { order: { display_order: "ASC" } }
    )

  res.json({ marketing_slides: slides, count })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any

  const slide = await marketingSlidesService.createMarketingSlides(req.body)

  res.status(201).json({ marketing_slide: slide })
}
