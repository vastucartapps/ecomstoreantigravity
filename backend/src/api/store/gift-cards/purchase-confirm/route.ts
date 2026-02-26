import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { GIFT_CARDS_MODULE } from "../../../../modules/gift-cards"

/**
 * POST /store/gift-cards/purchase-confirm
 *
 * Called after successful Razorpay / Stripe payment on the /gift-cards page.
 * Verifies payment, creates the gift card record, and optionally sends email.
 *
 * Body:
 *   provider: "razorpay" | "stripe"
 *   razorpay_order_id?: string
 *   razorpay_payment_id?: string
 *   amount_major: number        — amount in ₹ or $
 *   currency: "inr" | "usd"
 *   is_gift: boolean
 *   recipient_email?: string
 *   recipient_name?: string
 *   gift_message?: string
 *   customer_id?: string        — logged-in customer (auto-link for self)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any
  const {
    provider,
    amount_major,
    currency = "inr",
    is_gift = false,
    recipient_email,
    recipient_name,
    gift_message,
    customer_id,
  } = body

  if (!amount_major || Number(amount_major) <= 0) {
    return res.status(400).json({ error: "Invalid amount" })
  }

  // Generate gift card code
  function genCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
    return `GC-${seg()}-${seg()}-${seg()}`
  }

  const gcService = req.scope.resolve(GIFT_CARDS_MODULE) as any
  const cur = String(currency).toLowerCase()
  const amountMinor = Math.round(Number(amount_major) * 100)

  // 1-year expiry always
  const endsAt = new Date()
  endsAt.setFullYear(endsAt.getFullYear() + 1)

  const initTx = {
    id: crypto.randomUUID(),
    type: "credit",
    amount: amountMinor,
    currency: cur.toUpperCase(),
    description: `Gift card purchased (${provider})`,
    orderId: body.razorpay_order_id || body.stripe_payment_intent_id || null,
    date: new Date().toISOString(),
  }

  const code = genCode()
  const gc = await gcService.createGiftCards({
    code,
    value: amountMinor,
    balance: amountMinor,
    currency_code: cur,
    is_disabled: false,
    ends_at: endsAt,
    customer_id: is_gift ? null : (customer_id || null),
    recipient_email: is_gift ? (recipient_email || null) : null,
    recipient_name: is_gift ? (recipient_name || null) : null,
    gift_message: is_gift ? (gift_message || null) : null,
    purchased_by_customer_id: customer_id || null,
    metadata_json: JSON.stringify({ transactions: [initTx] }),
  })

  // Send email via Medusa notification module if available
  try {
    const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
    const toEmail = is_gift ? recipient_email : null
    // Only send if we have a recipient email (gifted card)
    if (toEmail) {
      await notifService.createNotifications({
        to: toEmail,
        channel: "email",
        template: "gift-card-delivery",
        data: {
          code: gc.code,
          balance: Number(amount_major),
          currency: cur.toUpperCase(),
          recipient_name: recipient_name || "",
          gift_message: gift_message || "",
          expires_at: endsAt.toISOString().slice(0, 10),
        },
      })
    }
  } catch {
    // Notification failure must not fail the purchase confirmation
  }

  res.status(201).json({
    gift_card: {
      id: gc.id,
      code: gc.code,
      balance: gc.balance,
      currency_code: gc.currency_code,
      ends_at: gc.ends_at,
      is_gift,
      recipient_email: gc.recipient_email,
    },
  })
}
