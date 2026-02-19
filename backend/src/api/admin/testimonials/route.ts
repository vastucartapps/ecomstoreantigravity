import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TESTIMONIALS_MODULE } from "../../../modules/testimonials"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
  const testimonials = await testimonialService.listTestimonials(
    {},
    { order: { display_order: "ASC" } }
  )
  res.json({ testimonials })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
  const testimonial = await testimonialService.createTestimonials(req.body)
  res.status(201).json({ testimonial })
}
