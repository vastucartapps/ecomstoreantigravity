import { model } from "@medusajs/framework/utils"

const BlockedDate = model.define("booking_blocked_date", {
  id: model.id().primaryKey(),
  date: model.text(),
  reason: model.text().default(""),
})

export default BlockedDate
