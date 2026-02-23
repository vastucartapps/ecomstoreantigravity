import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Razorpay from "razorpay"

/**
 * POST /store/razorpay/create-order
 *
 * Creates a Razorpay order using keys stored in Admin → Payments.
 * This route runs in the full Medusa application container and has
 * access to all modules — unlike payment providers which are isolated.
 *
 * Body: { amount: number (rupees), currency?: string }
 * Returns: { order_id, key_id, amount (paise), currency }
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Read keys from store.metadata (Admin → Payments → Gateways)
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const gateways = (stores?.[0]?.metadata as any)?.payments_tax_config?.gateways
    const key_id: string | undefined = gateways?.razorpay?.keyId
    const key_secret: string | undefined = gateways?.razorpay?.keySecret

    if (!key_id || !key_secret) {
      return res.status(400).json({
        error: "Razorpay keys not configured. Go to Admin → Payments and add your API keys.",
      })
    }

    const body = req.body as { amount?: number; currency?: string }
    const amountRupees = Number(body?.amount || 0)
    if (!amountRupees || amountRupees <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }

    const currency = (body?.currency || "INR").toUpperCase()

    // Create Razorpay order (amount in paise)
    const razorpay = new Razorpay({ key_id, key_secret })
    const order = await (razorpay.orders.create as any)({
      amount: Math.round(amountRupees * 100), // rupees → paise
      currency,
      receipt: `vc_${Date.now()}`,
    })

    res.json({
      order_id: order.id,
      key_id,
      amount: order.amount,   // paise
      currency: order.currency,
    })
  } catch (err: any) {
    const msg = err?.error?.description || err?.message || "Failed to create Razorpay order"
    res.status(500).json({ error: msg })
  }
}
