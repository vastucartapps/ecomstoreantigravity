import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../../modules/marketing-slides"
import { stripUndefined } from "../../../../lib/strip-undefined"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  const slide = await marketingSlidesService.retrieveMarketingSlide(id)

  res.json({ marketing_slide: slide })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  try {
    const slide = await marketingSlidesService.updateMarketingSlides({
      id,
      ...stripUndefined(req.body as Record<string, unknown>),
    })
    res.json({ marketing_slide: slide })
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Failed to update marketing slide" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  await marketingSlidesService.deleteMarketingSlides(id)

  res.status(200).json({ id, deleted: true })
}
