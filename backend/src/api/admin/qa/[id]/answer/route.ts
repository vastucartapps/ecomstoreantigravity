import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { PRODUCT_QA_MODULE } from "../../../../../modules/product-qa"
import { captureException } from "../../../../../lib/error-reporter"
import { fetchBrandFromStore } from "../../../../../lib/brand-from-store"

/**
 * Resolve the reply signature for an admin-issued QA answer.
 * Order of preference:
 *   1. The signed-in admin's first/last name (so customers see a real human)
 *   2. The admin-configured team signature (brand.teamSignature) so a rename
 *      from "VastuCart Team" to something else propagates automatically
 *   3. A hardcoded "VastuCart Team" last resort
 */
async function getAdminName(req: MedusaRequest): Promise<string> {
  let brandSignature = "VastuCart Team"
  try {
    const brand = await fetchBrandFromStore(req.scope)
    brandSignature = brand.teamSignature || brandSignature
  } catch {
    // brand fetch failed — fall through to hardcoded
  }
  try {
    const actorId = (req as any).auth_context?.actor_id
    if (!actorId) return brandSignature

    const userService = req.scope.resolve("userModuleService") as any
    const user = await userService.retrieveUser(actorId)
    if (user?.first_name || user?.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(" ")
    }
    return brandSignature
  } catch {
    return brandSignature
  }
}

/** POST — submit a new answer */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>

  if (!body.answer?.trim()) {
    return res.status(400).json({ error: "answer is required" })
  }

  try {
    const qaService = req.scope.resolve(PRODUCT_QA_MODULE) as any
    const answeredBy = await getAdminName(req)

    const updated = await qaService.updateProductQuestions({
      id,
      answer: body.answer.trim(),
      answered_by: answeredBy,
      answered_at: new Date().toISOString(),
      is_admin_answer: true,
    })

    res.json({ question: Array.isArray(updated) ? updated[0] : updated, success: true })
  } catch (err) {
    captureException(err, { source: "api/admin/qa/[id]/answer:POST", question_id: id })
    res.status(500).json({
      success: false,
      message: (err as Error)?.message || "Failed to submit answer",
    })
  }
}

/** PATCH — edit an existing answer */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as Record<string, any>

  if (!body.answer?.trim()) {
    return res.status(400).json({ error: "answer is required" })
  }

  try {
    const qaService = req.scope.resolve(PRODUCT_QA_MODULE) as any
    const answeredBy = await getAdminName(req)

    const updated = await qaService.updateProductQuestions({
      id,
      answer: body.answer.trim(),
      answered_by: answeredBy,
      answered_at: new Date().toISOString(),
      is_admin_answer: true,
    })

    res.json({ question: Array.isArray(updated) ? updated[0] : updated, success: true })
  } catch (err) {
    captureException(err, { source: "api/admin/qa/[id]/answer:PATCH", question_id: id })
    res.status(500).json({
      success: false,
      message: (err as Error)?.message || "Failed to update answer",
    })
  }
}

/** DELETE — remove an answer (question returns to unanswered) */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params

  try {
    const qaService = req.scope.resolve(PRODUCT_QA_MODULE) as any
    const updated = await qaService.updateProductQuestions({
      id,
      answer: null,
      answered_by: null,
      answered_at: null,
      is_admin_answer: false,
    })

    res.json({ question: Array.isArray(updated) ? updated[0] : updated, success: true })
  } catch (err) {
    captureException(err, { source: "api/admin/qa/[id]/answer:DELETE", question_id: id })
    res.status(500).json({
      success: false,
      message: (err as Error)?.message || "Failed to delete answer",
    })
  }
}
