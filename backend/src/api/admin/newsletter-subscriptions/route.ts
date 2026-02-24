import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_SUBSCRIPTIONS_MODULE } from "../../../modules/newsletter-subscriptions"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const newsletterService = req.scope.resolve(NEWSLETTER_SUBSCRIPTIONS_MODULE)

  const { limit = "50", offset = "0" } = req.query as Record<string, string>

  const safeLimit = Math.min(parseInt(limit) || 50, 500)
  const safeOffset = Math.max(0, parseInt(offset) || 0)

  const subscriptions = await newsletterService.listNewsletterSubscriptions(
    {},
    { order: { created_at: "DESC" }, take: safeLimit, skip: safeOffset }
  )
  res.json({ subscriptions })
}
