import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_SUBSCRIPTIONS_MODULE } from "../../../modules/newsletter-subscriptions"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const newsletterService = req.scope.resolve(NEWSLETTER_SUBSCRIPTIONS_MODULE) as any
  const { email } = req.body as { email: string }

  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  // Check if already subscribed
  const existing = await newsletterService.listNewsletterSubscriptions({ email })

  if (existing.length > 0) {
    // Re-activate if previously unsubscribed
    if (!existing[0].is_active) {
      await newsletterService.updateNewsletterSubscriptions({
        id: existing[0].id,
        is_active: true,
      })
    }
    res.json({ message: "Subscribed successfully" })
    return
  }

  await newsletterService.createNewsletterSubscriptions({ email })
  res.status(201).json({ message: "Subscribed successfully" })
}
