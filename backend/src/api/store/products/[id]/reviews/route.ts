import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE)

  const reviews = await reviewService.listProductReviews(
    { product_id: id },
    { order: { created_at: "DESC" } }
  )

  // Calculate rating breakdown
  const total = reviews.length
  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
  let sum = 0

  for (const r of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(r.rating)))
    distribution[String(rating)] = (distribution[String(rating)] || 0) + 1
    sum += r.rating
  }

  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0

  // Parse photos JSON string for each review
  const mapped = reviews.map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    text: r.text,
    reviewerName: r.reviewer_name,
    reviewerLocation: r.reviewer_location,
    isVerifiedPurchase: r.is_verified_purchase,
    photos: (() => {
      try { return JSON.parse(r.photos || "[]") }
      catch { return [] }
    })(),
    createdAt: r.created_at,
    variant: r.variant,
  }))

  res.json({
    reviews: mapped,
    rating_breakdown: { average, total, distribution },
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE)

  const body = req.body as Record<string, any>

  const review = await reviewService.createProductReviews({
    product_id: id,
    reviewer_name: body.reviewer_name || "Anonymous",
    reviewer_location: body.reviewer_location || "",
    rating: Math.min(5, Math.max(1, Number(body.rating) || 5)),
    title: body.title || "",
    text: body.text || "",
    photos: JSON.stringify(body.photos || []),
    variant: body.variant || "",
    is_verified_purchase: !!body.is_verified_purchase,
    status: "pending",
    customer_email: body.customer_email || null,
    admin_response: null,
  })

  res.status(201).json({ review })
}
