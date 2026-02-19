import { model } from "@medusajs/framework/utils"

const EcosystemSlot = model.define("ecosystem_slot", {
  id: model.id().primaryKey(),
  site_id: model.text(),
  name: model.text(),
  ratio: model.text(),
  is_active: model.boolean().default(true),
  current_banner_id: model.text().nullable(),
})

export default EcosystemSlot
