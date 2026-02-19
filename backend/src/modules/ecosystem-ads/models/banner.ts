import { model } from "@medusajs/framework/utils"

const EcosystemBanner = model.define("ecosystem_banner", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  headline: model.text(),
  cta_text: model.text().default(""),
  cta_url: model.text().default(""),
  status: model.enum(["draft", "scheduled", "live", "expired"]).default("draft"),
  is_active: model.boolean().default(false),
  start_date: model.dateTime().nullable(),
  end_date: model.dateTime().nullable(),
  priority: model.number().default(1),
  product_ids_json: model.text().default("[]"),
  product_names_json: model.text().default("[]"),
  creatives_json: model.text().default("[]"),
})

export default EcosystemBanner
