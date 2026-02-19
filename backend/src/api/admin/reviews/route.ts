import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../../modules/product-review"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const reviewService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const { status, search, limit = "100", offset = "0" } = req.query as Record<string, string>

  const filter: Record<string, any> = {}
  if (status && status !== "all") {
    filter.status = status
  }

  const [reviews, count] = await reviewService.listAndCountProductReviews(filter, {
    order: { created_at: "DESC" },
    take: Number(limit),
    skip: Number(offset),
  })

  // Collect unique product IDs for join
  const productIds = [...new Set((reviews as any[]).map((r: any) => r.product_id).filter(Boolean))]

  // Fetch product data from Medusa product module
  const productMap = new Map<string, any>()
  if (productIds.length > 0) {
    try {
      const products = await productModule.listProducts(
        { id: productIds as string[] },
        { select: ["id", "title", "thumbnail"] }
      )
      for (const p of products) {
        productMap.set(p.id, p)
      }
    } catch {
      // Non-fatal: product data unavailable
    }
  }

  let mapped = (reviews as any[]).map((r: any) => {
    const product = productMap.get(r.product_id)
    return {
      id: r.id,
      customerName: r.reviewer_name || "Anonymous",
      customerEmail: r.customer_email || "",
      productId: r.product_id,
      productName: product?.title || "Unknown Product",
      productImageUrl: product?.thumbnail || "",
      rating: r.rating,
      title: r.title,
      text: r.text,
      photos: (() => {
        try { return JSON.parse(r.photos || "[]") } catch { return [] }
      })(),
      isVerifiedPurchase: r.is_verified_purchase,
      status: r.status || "pending",
      adminResponse: r.admin_response || null,
      createdAt: r.created_at,
    }
  })

  // Client-side search by customer name, email, or product name
  if (search) {
    const q = search.toLowerCase()
    mapped = mapped.filter(
      r =>
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
    )
  }

  res.json({ reviews: mapped, count: mapped.length })
}
