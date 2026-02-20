import { model } from "@medusajs/framework/utils"

const GiftCard = model.define("gift_card", {
  id: model.id().primaryKey(),
  code: model.text().searchable(),
  value: model.number(),         // initial value in minor units (paise)
  balance: model.number(),       // current balance in minor units
  currency_code: model.text().default("inr"),
  is_disabled: model.boolean().default(false),
  ends_at: model.dateTime().nullable(),
  metadata_json: model.text().nullable(), // JSON string for transactions array
})

export default GiftCard
