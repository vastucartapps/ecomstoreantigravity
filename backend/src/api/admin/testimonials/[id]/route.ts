import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TESTIMONIALS_MODULE } from "../../../../modules/testimonials"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
  const testimonial = await testimonialService.retrieveTestimonial(req.params.id)
  res.json({ testimonial })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
  const testimonial = await testimonialService.updateTestimonials({
    id: req.params.id,
    ...(req.body as Record<string, unknown>),
  })
  res.json({ testimonial })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
  await testimonialService.deleteTestimonials(req.params.id)
  res.status(200).json({ id: req.params.id, deleted: true })
}
