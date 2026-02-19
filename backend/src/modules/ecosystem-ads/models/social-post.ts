import { model } from "@medusajs/framework/utils"

const SocialPost = model.define("social_post", {
  id: model.id().primaryKey(),
  banner_id: model.text(),
  platform: model.enum(["pinterest", "instagram", "facebook", "twitter", "threads"]),
  post_url: model.text().default(""),
  status: model.enum(["published", "pending", "failed"]).default("pending"),
  published_at: model.dateTime().nullable(),
  caption: model.text().default(""),
  meta_json: model.text().default("{}"),
})

export default SocialPost
