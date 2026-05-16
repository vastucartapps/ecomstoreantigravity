import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { captureException, captureWarning } from "../../../../lib/error-reporter"

/**
 * POST /store/stripe/verify
 *
 * Confirms a Stripe PaymentIntent is genuinely captured (or at least
 * authorized) before VastuCart marks the cart complete. Parallel to the
 * Razorpay verify route — same security model. Without this, a forged
 * stripe.confirmCardPayment success on the client would complete a cart
 * without any money moving.
 *
 * Body: { payment_intent_id: string }
 * Returns: { verified: true, status, amount, currency } on success.
 *          400 with `error` on mismatch.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as { payment_intent_id?: string }
    const piId = (body.payment_intent_id || "").trim()
    if (!piId) {
      return res
        .status(400)
        .json({ verified: false, error: "payment_intent_id is required" })
    }

    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const secretKey = (store?.metadata as any)?.payments_tax_config?.gateways?.stripe
      ?.secretKey

    if (!secretKey) {
      captureWarning("stripe/verify: secret key not configured", {
        source: "api/store/stripe/verify",
        payment_intent_id: piId,
      })
      return res
        .status(400)
        .json({ verified: false, error: "Stripe not configured" })
    }

    const stripe = new Stripe(secretKey, { apiVersion: "2025-09-30.clover" })
    const intent = await stripe.paymentIntents.retrieve(piId)

    // succeeded = captured charge; requires_capture = authorized but not yet
    // captured (only happens if we ever switch to manual capture). Both are
    // valid for "the customer has paid" semantics.
    const status = intent.status
    if (status !== "succeeded" && status !== "requires_capture") {
      return res.status(400).json({
        verified: false,
        error: `payment status is ${status} — not captured`,
      })
    }

    return res.json({
      verified: true,
      status,
      amount: intent.amount,
      currency: intent.currency,
    })
  } catch (err: any) {
    captureException(err, { source: "api/store/stripe/verify" })
    return res
      .status(500)
      .json({ verified: false, error: err?.message || "Verification failed" })
  }
}
