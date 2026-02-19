import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_QA_MODULE } from "../../../../../modules/product-qa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)

  const questions = await qaService.listProductQuestions(
    { product_id: id },
    { order: { created_at: "DESC" } }
  )

  const mapped = questions.map((q: any) => ({
    id: q.id,
    question: q.question,
    askedBy: q.asked_by,
    askedAt: q.created_at,
    answer: q.answer,
    answeredBy: q.answered_by,
    answeredAt: q.answered_at,
    isAdminAnswer: q.is_admin_answer,
  }))

  res.json({ questions: mapped })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)

  const body = req.body as Record<string, any>

  const question = await qaService.createProductQuestions({
    product_id: id,
    question: body.question || "",
    asked_by: body.asked_by || "Anonymous",
    answer: body.answer || null,
    answered_by: body.answered_by || null,
    answered_at: body.answered_at || null,
    is_admin_answer: !!body.is_admin_answer,
  })

  res.status(201).json({ question })
}
