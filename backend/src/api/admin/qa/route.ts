import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { PRODUCT_QA_MODULE } from "../../../modules/product-qa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const { status, search, limit = "100", offset = "0" } = req.query as Record<string, string>

  const filter: Record<string, any> = {}
  if (status && status !== "all") {
    // answered = has an answer, unanswered = no answer
    if (status === "answered") {
      filter.is_admin_answer = true
    } else if (status === "unanswered") {
      filter.is_admin_answer = false
    }
  }

  const [questions, count] = await qaService.listAndCountProductQuestions(filter, {
    order: { created_at: "DESC" },
    take: Number(limit),
    skip: Number(offset),
  })

  // Collect unique product IDs for join
  const productIds = [...new Set((questions as any[]).map((q: any) => q.product_id).filter(Boolean))]

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
      // Non-fatal
    }
  }

  let mapped = (questions as any[]).map((q: any) => {
    const product = productMap.get(q.product_id)
    const isAnswered = !!(q.answer && q.is_admin_answer)
    return {
      id: q.id,
      customerName: q.asked_by || "Anonymous",
      productId: q.product_id,
      productName: product?.title || "Unknown Product",
      productImageUrl: product?.thumbnail || "",
      question: q.question,
      answer: q.answer || null,
      answeredBy: q.answered_by || null,
      status: isAnswered ? "answered" : "unanswered",
      createdAt: q.created_at,
      answeredAt: q.answered_at || null,
    }
  })

  // Client-side search by customer name or product name
  if (search) {
    const sq = search.toLowerCase()
    mapped = mapped.filter(
      q =>
        q.customerName.toLowerCase().includes(sq) ||
        q.productName.toLowerCase().includes(sq) ||
        q.question.toLowerCase().includes(sq)
    )
  }

  res.json({ questions: mapped, count: mapped.length })
}
