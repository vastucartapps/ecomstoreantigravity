import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { TESTIMONIALS_MODULE } from "../../../modules/testimonials"
import { captureException } from "../../../lib/error-reporter"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
    const testimonials = await testimonialService.listTestimonials(
      {},
      { order: { display_order: "ASC" } }
    )
    res.json({ testimonials })
  } catch (err) {
    captureException(err, { source: "api/admin/testimonials:GET" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to list testimonials",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const testimonialService = req.scope.resolve(TESTIMONIALS_MODULE) as any
    const testimonial = await testimonialService.createTestimonials(req.body)
    res.status(201).json({ testimonial })
  } catch (err) {
    captureException(err, { source: "api/admin/testimonials:POST" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to create testimonial",
    })
  }
}
