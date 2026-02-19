import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_SUBSCRIPTIONS_MODULE } from "../../../modules/newsletter-subscriptions"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const newsletterService = req.scope.resolve(NEWSLETTER_SUBSCRIPTIONS_MODULE)
  const subscriptions = await newsletterService.listNewsletterSubscriptions(
    {},
    { order: { created_at: "DESC" } }
  )
  res.json({ subscriptions })
}
