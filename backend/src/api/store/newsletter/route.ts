import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { NEWSLETTER_SUBSCRIPTIONS_MODULE } from "../../../modules/newsletter-subscriptions"
import { addNewsletterSubscriber } from "../../../lib/listmonk-client"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const newsletterService = req.scope.resolve(NEWSLETTER_SUBSCRIPTIONS_MODULE) as any
  const { email } = req.body as { email: string }

  if (!email || !email.includes("@")) {
    res.status(400).json({ message: "Valid email is required" })
    return
  }

  // Save to our DB
  const existing = await newsletterService.listNewsletterSubscriptions({ email })
  if (existing.length > 0) {
    if (!existing[0].is_active) {
      await newsletterService.updateNewsletterSubscriptions({
        id: existing[0].id,
        is_active: true,
      })
    }
  } else {
    await newsletterService.createNewsletterSubscriptions({ email })
  }

  // Sync to Listmonk newsletter list (non-blocking — don't fail if Listmonk is down)
  addNewsletterSubscriber(email).catch((err: any) => {
    const logger = (req as any).scope?.resolve?.("logger") as any
    logger?.warn?.(`[newsletter] Listmonk sync failed for ${email}: ${err.message}`)
  })

  res.status(existing.length > 0 ? 200 : 201).json({ message: "Subscribed successfully" })
}
