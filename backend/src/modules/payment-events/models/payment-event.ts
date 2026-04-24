import { model } from "@medusajs/framework/utils"

/**
 * payment_event — one row per checkout / payment lifecycle transition.
 *
 * Funnel stages:
 *   - initiated   → payment session created or gateway modal opened
 *   - succeeded   → payment captured + order placed
 *   - failed      → gateway returned an error
 *   - dismissed   → user closed the modal without paying
 *
 * The dashboard reads these rows to answer "how many carts reach each stage
 * vs. drop off here". Paired with trackPaymentFailed / trackPaymentSucceeded
 * on the frontend (lib/analytics/events.ts).
 */
const PaymentEvent = model.define("payment_event", {
  id: model.id().primaryKey(),
  cart_id: model.text().searchable(),
  order_id: model.text().nullable(),
  stage: model.enum(["initiated", "succeeded", "failed", "dismissed"]),
  provider: model.text(), // razorpay | stripe | paypal | cod | system
  currency: model.text(), // inr | usd
  amount: model.number().default(0), // minor units (paise / cents)
  error_code: model.text().nullable(),
  error_message: model.text().nullable(),
  user_agent: model.text().nullable(),
  ip_address: model.text().nullable(),
  email: model.text().nullable(), // customer email at failure — helps with manual recovery outreach
})

export default PaymentEvent
