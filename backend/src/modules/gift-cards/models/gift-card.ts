import { model } from "@medusajs/framework/utils"

const GiftCard = model.define("gift_card", {
  id: model.id().primaryKey(),
  code: model.text().searchable(),
  value: model.number(),                       // initial value in minor units (paise/cents)
  balance: model.number(),                     // current balance in minor units
  currency_code: model.text().default("inr"),
  is_disabled: model.boolean().default(false),
  ends_at: model.dateTime().nullable(),        // always 1 year from creation
  customer_id: model.text().nullable(),        // linked owner (auto-link on self-purchase or recipient login)
  recipient_email: model.text().nullable(),    // gift recipient email
  recipient_name: model.text().nullable(),     // gift recipient name
  gift_message: model.text().nullable(),       // optional gift message
  purchased_by_customer_id: model.text().nullable(), // who purchased this card
  metadata_json: model.text().nullable(),      // JSON string for transactions array
})

export default GiftCard
