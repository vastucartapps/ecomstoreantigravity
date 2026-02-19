import { model } from "@medusajs/framework/utils"

const ActiveSession = model.define("active_session", {
  id: model.id().primaryKey(),
  auth_identity_id: model.text(),
  device: model.text().default("Unknown"),
  ip_address: model.text().default("0.0.0.0"),
  location: model.text().default("Unknown"),
  user_agent: model.text().default(""),
  last_active: model.dateTime(),
  is_current: model.boolean().default(false),
  token_hash: model.text(),
})

export default ActiveSession
