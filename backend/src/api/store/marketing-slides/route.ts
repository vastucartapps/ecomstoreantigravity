import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_SLIDES_MODULE } from "../../../modules/marketing-slides"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const marketingSlidesService = req.scope.resolve(MARKETING_SLIDES_MODULE)

  const [slides] = await marketingSlidesService.listAndCountMarketingSlides(
    { is_active: true },
    { order: { display_order: "ASC" } }
  )

  res.json({ marketing_slides: slides })
}
