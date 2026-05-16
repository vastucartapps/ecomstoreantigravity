import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDES_MODULE } from "../../../modules/hero-slides"
import { captureException } from "../../../lib/error-reporter"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
    const heroSlides = await heroSlidesService.listHeroSlides(
      {},
      { order: { display_order: "ASC" } }
    )
    res.json({ hero_slides: heroSlides })
  } catch (err) {
    captureException(err, { source: "api/admin/hero-slides:GET" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to list hero slides",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE) as any
    const heroSlide = await heroSlidesService.createHeroSlides(req.body)
    res.status(201).json({ hero_slide: heroSlide })
  } catch (err) {
    captureException(err, { source: "api/admin/hero-slides:POST" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to create hero slide",
    })
  }
}
