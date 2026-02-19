import { model } from "@medusajs/framework/utils"

const NewsletterSubscription = model.define("newsletter_subscription", {
  id: model.id().primaryKey(),
  email: model.text(),
  is_active: model.boolean().default(true),
})

export default NewsletterSubscription
