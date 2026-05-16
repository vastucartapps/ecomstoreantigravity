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
      status: "rejected",
      admin_response: body.reason || null,
    })
    res.json({ review: Array.isArray(updated) ? updated[0] : updated, success: true })
  } catch (err) {
    captureException(err, { source: "api/admin/reviews/[id]/reject", review_id: id })
    res.status(500).json({
      success: false,
      message: (err as Error)?.message || "Failed to reject review",
    })
  }
}
