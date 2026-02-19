import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDES_MODULE } from "../../../modules/hero-slides"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const heroSlidesService = req.scope.resolve(HERO_SLIDES_MODULE)

  const heroSlides = await heroSlidesService.listHeroSlides(
    { is_active: true },
    { order: { display_order: "ASC" } }
  )

  res.json({ hero_slides: heroSlides })
}
