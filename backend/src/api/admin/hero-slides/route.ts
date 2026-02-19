import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDES_MODULE } from "../../../modules/hero-slides"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
  const heroSlides = await heroSlidesService.listHeroSlides(
    {},
    { order: { display_order: "ASC" } }
  )
  res.json({ hero_slides: heroSlides })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
  const heroSlide = await heroSlidesService.createHeroSlides(req.body)
  res.status(201).json({ hero_slide: heroSlide })
}
