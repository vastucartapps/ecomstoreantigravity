import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Razorpay from "razorpay"

/**
 * POST /store/gift-cards/purchase-intent
 *
 * Creates a Razorpay (INR) or Stripe (USD) payment order/intent for
 * purchasing a gift card. No Medusa cart involved — standalone purchase.
 *
 * Body:
 *   amount_major: number       — amount in major units (₹ or $)
 *   currency: "inr" | "usd"
 *   is_gift: boolean
 *   recipient_email?: string
 *   recipient_name?: string
 *   gift_message?: string
 *   customer_id?: string       — logged-in customer (optional, auto-link)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any
  const { amount_major, currency = "inr" } = body

  if (!amount_major || Number(amount_major) <= 0) {
    return res.status(400).json({ error: "Invalid amount" })
  }

  const storeService = req.scope.resolve(Modules.STORE) as any
  const stores = await storeService.listStores({}, { take: 1 })
  const gateways = (stores?.[0]?.metadata as any)?.payments_tax_config?.gateways

  const cur = String(currency).toLowerCase()

  if (cur === "inr") {
    const key_id: string | undefined = gateways?.razorpay?.keyId
    const key_secret: string | undefined = gateways?.razorpay?.keySecret
    if (!key_id || !key_secret) {
      return res.status(400).json({ error: "Razorpay not configured" })
    }

    const razorpay = new Razorpay({ key_id, key_secret })
    const order = await (razorpay.orders.create as any)({
      amount: Math.round(Number(amount_major) * 100), // rupees → paise
      currency: "INR",
      receipt: `gc_${Date.now()}`,
    })

    return res.json({ provider: "razorpay", order_id: order.id, key_id, amount_paise: order.amount })
  }

  if (cur === "usd") {
    const secretKey: string | undefined = gateways?.stripe?.secretKey
    if (!secretKey) return res.status(400).json({ error: "Stripe not configured" })

    const stripe = require("stripe")(secretKey)
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount_major) * 100), // dollars → cents
      currency: "usd",
      metadata: { type: "gift_card_purchase" },
    })

    return res.json({ provider: "stripe", client_secret: intent.client_secret, amount_cents: intent.amount })
  }

  res.status(400).json({ error: "Unsupported currency. Use inr or usd." })
}
