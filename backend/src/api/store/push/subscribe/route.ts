import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PUSH_SUBSCRIPTIONS_MODULE } from "../../../../modules/push-subscriptions"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { endpoint, keys, customer_id } = req.body as any

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: "Invalid push subscription payload" })
  }

  try {
    const svc = req.scope.resolve(PUSH_SUBSCRIPTIONS_MODULE) as any
    const userAgent = req.headers["user-agent"] || null

    // Upsert: delete existing for this endpoint, then create fresh
    const existing = await svc.listPushSubscriptions({ endpoint }, { take: 1 })
    if (existing?.length) {
      await svc.deletePushSubscription(existing[0].id)
    }

    await svc.createPushSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      customer_id: customer_id || null,
      user_agent: userAgent,
    })

    res.status(201).json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save subscription" })
  }
}
