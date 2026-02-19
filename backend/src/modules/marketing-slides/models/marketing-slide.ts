import { model } from "@medusajs/framework/utils"

const MarketingSlide = model.define("marketing_slide", {
  id: model.id().primaryKey(),
  image_url: model.text(),
  quote: model.text(),
  attribution: model.text().default("VastuCart"),
  is_active: model.boolean().default(true),
  display_order: model.number().default(0),
})

export default MarketingSlide
