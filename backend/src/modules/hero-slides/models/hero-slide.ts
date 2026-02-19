import { model } from "@medusajs/framework/utils"

const HeroSlide = model.define("hero_slide", {
  id: model.id().primaryKey(),
  image_url: model.text(),
  heading: model.text(),
  subtext: model.text(),
  cta_label: model.text().default("Shop Now"),
  cta_link: model.text().default("/"),
  is_active: model.boolean().default(true),
  display_order: model.number().default(0),
})

export default HeroSlide
