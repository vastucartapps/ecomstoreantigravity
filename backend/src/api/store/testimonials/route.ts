import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TESTIMONIALS_MODULE } from "../../../modules/testimonials"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE)

  const testimonials = await testimonialService.listTestimonials(
    { is_active: true },
    { order: { display_order: "ASC" } }
  )

  res.json({ testimonials })
}
