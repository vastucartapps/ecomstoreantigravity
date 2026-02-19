import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as Record<string, any>
  const { action, review_ids } = body

  if (!action || !Array.isArray(review_ids) || review_ids.length === 0) {
    return res.status(400).json({ error: "action and review_ids are required" })
  }

  if (action !== "approve" && action !== "reject") {
    return res.status(400).json({ error: "action must be 'approve' or 'reject'" })
  }

  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const status = action === "approve" ? "approved" : "rejected"

  const updates = review_ids.map((id: string) => ({ id, status }))
  await reviewService.updateProductReviews(updates)

  res.json({ success: true, updated: review_ids.length })
}
