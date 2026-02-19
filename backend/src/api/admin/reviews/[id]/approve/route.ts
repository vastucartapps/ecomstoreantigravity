import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>
  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE)

  await reviewService.updateProductReviews({
    id,
    status: "approved",
    admin_response: body.admin_response || null,
  })

  res.json({ success: true })
}
