import { model } from "@medusajs/framework/utils"

const Testimonial = model.define("testimonial", {
  id: model.id().primaryKey(),
  quote: model.text(),
  name: model.text(),
  location: model.text(),
  avatar_url: model.text().nullable(),
  rating: model.number().default(5),
  type: model.text().default("testimonial"),
  product_name: model.text().nullable(),
  is_active: model.boolean().default(true),
  display_order: model.number().default(0),
})

export default Testimonial
