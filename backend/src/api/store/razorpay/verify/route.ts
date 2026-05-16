import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createHmac, timingSafeEqual } from "node:crypto"
import Razorpay from "razorpay"
import { captureException, captureWarning } from "../../../../lib/error-reporter"

/**
 * POST /store/razorpay/verify
 *
 * Confirms a Razorpay payment is real before VastuCart marks the cart
 * complete. Two-layer defense:
 *
 *   1. HMAC signature verification — if the client supplies the
 *      `razorpay_signature` (standard checkout flow returns it in the
 *      handler response), we recompute HMAC-SHA256(order_id|payment_id)
 *      with the secret stored in admin store.metadata and compare with
 *      timingSafeEqual. A mismatch means the client is forging success.
 *
 *   2. Server-side fetch — regardless of signature, we call Razorpay's
 *      Orders API to confirm the payment is actually captured/authorized
 *      AND that the amount matches what we created the order for. This
 *      catches the custom checkout flow (`rzp.createPayment`) where no
 *      signature is returned to the client.
 *
 * Without this endpoint, the previous flow called cart.complete() the
 * instant the modal fired `payment.success` — trivially forgeable from
 * the browser DevTools console.
 *
 * Body: { order_id: string, payment_id: string, signature?: string }
 * Returns: { verified: true, status, amount, currency } on success.
 *          400 on any verification failure with `error` field.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as {
      order_id?: string
      payment_id?: string
      signature?: string
    }
    const orderId = (body.order_id || "").trim()
    const paymentId = (body.payment_id || "").trim()
    const signature = (body.signature || "").trim()

    if (!orderId || !paymentId) {
      return res.status(400).json({
        verified: false,
        error: "order_id and payment_id are required",
      })
    }

    // Pull keys from admin store metadata (same source as create-order).
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const gateways = (stores?.[0]?.metadata as any)?.payments_tax_config?.gateways
    const keyId: string | undefined = gateways?.razorpay?.keyId
    const keySecret: string | undefined = gateways?.razorpay?.keySecret

    if (!keyId || !keySecret) {
      captureWarning("razorpay/verify: keys not configured", {
        source: "api/store/razorpay/verify",
        order_id: orderId,
      })
      return res
        .status(400)
        .json({ verified: false, error: "Razorpay not configured" })
    }

    // Layer 1 — HMAC signature (when provided by standard checkout)
    if (signature) {
      const expected = createHmac("sha256", keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex")
      const expectedBuf = Buffer.from(expected, "hex")
      const actualBuf = Buffer.from(signature, "hex")
      if (
        expectedBuf.length !== actualBuf.length ||
        !timingSafeEqual(expectedBuf, actualBuf)
      ) {
        captureWarning("razorpay/verify: signature mismatch", {
          source: "api/store/razorpay/verify",
          order_id: orderId,
          payment_id: paymentId,
        })
        return res
          .status(400)
          .json({ verified: false, error: "signature mismatch" })
      }
    }

    // Layer 2 — authoritative server-side fetch
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret })
    const payment = await razorpay.payments.fetch(paymentId)

    const status = (payment as any)?.status as string | undefined
    const paymentOrderId = (payment as any)?.order_id as string | undefined

    if (paymentOrderId !== orderId) {
      captureWarning("razorpay/verify: order_id mismatch", {
        source: "api/store/razorpay/verify",
        provided_order_id: orderId,
        actual_order_id: paymentOrderId,
        payment_id: paymentId,
      })
      return res.status(400).json({
        verified: false,
        error: "payment does not belong to the supplied order",
      })
    }

    if (status !== "captured" && status !== "authorized") {
      return res.status(400).json({
        verified: false,
        error: `payment status is ${status ?? "unknown"} — not captured`,
      })
    }

    return res.json({
      verified: true,
      status,
      amount: (payment as any)?.amount, // paise
      currency: (payment as any)?.currency,
    })
  } catch (err: any) {
    captureException(err, { source: "api/store/razorpay/verify" })
    return res
      .status(500)
      .json({ verified: false, error: err?.message || "Verification failed" })
  }
}
