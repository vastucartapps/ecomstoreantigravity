import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../../modules/marketing-slides"
import { stripUndefined } from "../../../../lib/strip-undefined"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE) as any
  const { id } = req.params

  const slide = await marketingSlidesService.retrieveMarketingSlide(id)
  // Return 404 instead of `{ marketing_slide: null }` so the admin UI can
  // distinguish "not found" from "API responded 200 with nothing".
  if (!slide) {
    return res.status(404).json({ message: "Marketing slide not found" })
  }
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
