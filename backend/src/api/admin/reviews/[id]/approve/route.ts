import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import { captureException } from "../../../../../lib/error-reporter"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>
  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE) as any

  try {
    const updated = await reviewService.updateProductReviews({
      id,
      status: "approved",
      admin_response: body.admin_response || null,
    })
    // Return the updated record so the admin UI can refresh inline without
    // a separate refetch round-trip (matches the testimonials/hero-slides
    // response shape).
    res.json({ review: Array.isArray(updated) ? updated[0] : updated, success: true })
  } catch (err) {
    captureException(err, { source: "api/admin/reviews/[id]/approve", review_id: id })
    res.status(500).json({
      success: false,
      message: (err as Error)?.message || "Failed to approve review",
    })
  }
}
