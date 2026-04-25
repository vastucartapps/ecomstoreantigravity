import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDES_MODULE } from "../../../../modules/hero-slides"
import { stripUndefined } from "../../../../lib/strip-undefined"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
  const heroSlide = await heroSlidesService.retrieveHeroSlide(req.params.id)
  res.json({ hero_slide: heroSlide })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
  try {
    const heroSlide = await heroSlidesService.updateHeroSlides({
      id: req.params.id,
      ...stripUndefined(req.body as Record<string, unknown>),
    })
    res.json({ hero_slide: heroSlide })
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Failed to update hero slide" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
  await heroSlidesService.deleteHeroSlides(req.params.id)
  res.status(200).json({ id: req.params.id, deleted: true })
}
