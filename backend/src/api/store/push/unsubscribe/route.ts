import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PUSH_SUBSCRIPTIONS_MODULE } from "../../../../modules/push-subscriptions"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { endpoint } = req.body as any

  if (!endpoint) {
    return res.status(400).json({ error: "endpoint is required" })
  }

  try {
    const svc = req.scope.resolve(PUSH_SUBSCRIPTIONS_MODULE) as any
    const existing = await svc.listPushSubscriptions({ endpoint }, { take: 1 })
    if (existing?.length) {
      await svc.deletePushSubscription(existing[0].id)
    }
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to remove subscription" })
  }
}
