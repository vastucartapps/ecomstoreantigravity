import { model } from "@medusajs/framework/utils"

const LoyaltyTransaction = model.define("loyalty_transaction", {
  id: model.id().primaryKey(),
  customer_id: model.text().searchable(),
  points: model.number(),
  type: model.enum(["earned", "redeemed", "adjusted", "expired"]),
  description: model.text(),
  balance_after: model.number(),
  expires_at: model.dateTime().nullable(),
  is_expired: model.boolean().default(false),
  order_id: model.text().nullable(),
})

export default LoyaltyTransaction
