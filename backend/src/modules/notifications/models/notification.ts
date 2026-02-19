import { model } from "@medusajs/framework/utils"

const Notification = model.define("customer_notification", {
  id: model.id().primaryKey(),
  customer_id: model.text().searchable(),
  type: model.enum(["order", "promotion", "stock", "loyalty"]),
  title: model.text(),
  message: model.text(),
  link: model.text().default(""),
  is_read: model.boolean().default(false),
})

export default Notification
