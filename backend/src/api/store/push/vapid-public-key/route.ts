import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  const key = process.env.VAPID_PUBLIC_KEY
  if (!key) {
    return res.status(503).json({ error: "Push notifications not configured" })
  }
  res.json({ vapidPublicKey: key })
}
