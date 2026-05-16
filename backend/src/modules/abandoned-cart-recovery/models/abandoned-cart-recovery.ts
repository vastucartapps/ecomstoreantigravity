import { model } from "@medusajs/framework/utils"

/**
 * abandoned_cart_recovery — one row per (cart, stage) email sent.
 *
 * The scheduled job inserts a row on each stage send; the subscriber
 * updates recovered_at/recovered_order_id/recovered_amount when any
 * recovery row for a cart eventually converts.
 *
 * Stages:
 *   1 — 1 hour reminder (no discount)
 *   2 — 24 hour reminder (social proof + urgency)
 *   3 — 72 hour last-chance with 5% single-use code (stored in discount_code)
 */
const AbandonedCartRecovery = model.define("abandoned_cart_recovery", {
  id: model.id().primaryKey(),
  cart_id: model.text().searchable(),
  email: model.text().searchable(),
  stage: model.number(), // 1 | 2 | 3
  sent_at: model.dateTime().default(new Date()),
  recovery_token: model.text().unique(), // for the one-click /cart/recover/[token] link
  discount_code: model.text().nullable(), // only set on stage 3
  discount_expires_at: model.dateTime().nullable(),
  recovered_at: model.dateTime().nullable(),
  recovered_order_id: model.text().nullable(),
  recovered_amount: model.number().default(0), // minor units — set on recovery
  // Set when the recipient clicks the unsubscribe link in any stage's email.
  // The recovery job filters on this and skips subsequent stages — opt-out
  // is one-click, immediate, and there's no need to manually re-enable.
  opted_out_at: model.dateTime().nullable(),
})

export default AbandonedCartRecovery
