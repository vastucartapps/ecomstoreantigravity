import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { PRODUCT_QA_MODULE } from "../../../../../modules/product-qa"

async function getAdminName(req: MedusaRequest): Promise<string> {
  try {
    const user = (req as any).auth_context?.actor_id
      ? (req as any).user
      : null
    if (user?.first_name || user?.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(" ")
    }
    return "VastuCart Team"
  } catch {
    return "VastuCart Team"
  }
}

/** POST — submit a new answer */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>

  if (!body.answer?.trim()) {
    return res.status(400).json({ error: "answer is required" })
  }

  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)
  const answeredBy = await getAdminName(req)

  await qaService.updateProductQuestions({
    id,
    answer: body.answer.trim(),
    answered_by: answeredBy,
    answered_at: new Date().toISOString(),
    is_admin_answer: true,
  })

  res.json({ success: true })
}

/** PATCH — edit an existing answer */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>

  if (!body.answer?.trim()) {
    return res.status(400).json({ error: "answer is required" })
  }

  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)
  const answeredBy = await getAdminName(req)

  await qaService.updateProductQuestions({
    id,
    answer: body.answer.trim(),
    answered_by: answeredBy,
    answered_at: new Date().toISOString(),
    is_admin_answer: true,
  })

  res.json({ success: true })
}

/** DELETE — remove an answer (question returns to unanswered) */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const qaService = req.scope.resolve(PRODUCT_QA_MODULE)

  await qaService.updateProductQuestions({
    id,
    answer: null,
    answered_by: null,
    answered_at: null,
    is_admin_answer: false,
  })

  res.json({ success: true })
}
