import { model } from "@medusajs/framework/utils"

const ProductReview = model.define("product_review", {
  id: model.id().primaryKey(),
  product_id: model.text().searchable(),
  reviewer_name: model.text(),
  reviewer_location: model.text().default(""),
  rating: model.number(),
  title: model.text(),
  text: model.text(),
  photos: model.text().default("[]"),
  variant: model.text().default(""),
  is_verified_purchase: model.boolean().default(false),
  status: model.text().default("pending"),
  admin_response: model.text().nullable(),
  customer_email: model.text().nullable(),
})

export default ProductReview
