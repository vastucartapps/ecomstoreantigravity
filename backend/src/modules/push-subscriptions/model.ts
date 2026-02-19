import { model } from "@medusajs/framework/utils"

const PushSubscription = model.define("push_subscription", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  endpoint: model.text(),
  p256dh: model.text(),
  auth: model.text(),
  user_agent: model.text().nullable(),
})

export default PushSubscription
