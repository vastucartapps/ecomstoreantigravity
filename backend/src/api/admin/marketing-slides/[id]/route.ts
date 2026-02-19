import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../../modules/marketing-slides"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  const slide = await marketingSlidesService.retrieveMarketingSlide(id)

  res.json({ marketing_slide: slide })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  const slide = await marketingSlidesService.updateMarketingSlides({
    id,
    ...(req.body as Record<string, unknown>),
  })

  res.json({ marketing_slide: slide })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  await marketingSlidesService.deleteMarketingSlides(id)

  res.status(200).json({ id, deleted: true })
}
