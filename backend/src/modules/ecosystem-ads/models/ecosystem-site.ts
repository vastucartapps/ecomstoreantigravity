import { model } from "@medusajs/framework/utils"

const EcosystemSite = model.define("ecosystem_site", {
  id: model.id().primaryKey(),
  subdomain: model.text().searchable(),
  display_name: model.text(),
  is_active: model.boolean().default(true),
})

export default EcosystemSite
