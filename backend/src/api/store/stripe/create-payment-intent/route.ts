import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * POST /store/stripe/create-payment-intent
 *
 * Creates a Stripe PaymentIntent using the secret key stored in
 * store.metadata.payments_tax_config.gateways.stripe (Admin → Payments).
 *
 * Request body:
 *   { amount: number, currency: string }
 *   amount — in MAJOR units (dollars), e.g. 49.99
 *   currency — ISO 4217 code, e.g. "USD"
 *
 * Response:
 *   { client_secret: string, payment_intent_id: string }
 *
 * The frontend uses the client_secret with Stripe.js to confirm the payment.
 * After Stripe confirms the payment, the frontend calls cart.complete() to
 * finalize the Medusa order. The stripe-db payment provider always authorizes
 * (the charge is already captured by Stripe before cart.complete() is called).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { amount, currency } = req.body as { amount: number; currency: string }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" })
    }
    if (!currency) {
      return res.status(400).json({ error: "Currency is required" })
    }

    // Read Stripe secret key from store.metadata (admin-driven, no env var)
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const secretKey = (store?.metadata as any)?.payments_tax_config?.gateways?.stripe?.secretKey

    if (!secretKey) {
      return res.status(400).json({
        error: "Stripe is not configured. Please add your Stripe secret key in Admin → Payments.",
      })
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2025-09-30.clover" })

    // Convert major units (dollars) → minor units (cents)
    const amountInMinorUnits = Math.round(amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInMinorUnits,
      currency: currency.toLowerCase(),
      // capture_method: "automatic" is the default — charge is captured immediately on confirmation
      automatic_payment_methods: { enabled: true },
    })

    res.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (err: any) {
    console.error("[stripe/create-payment-intent] Error:", err?.message)
    res.status(500).json({ error: err?.message || "Failed to create payment intent" })
  }
}
