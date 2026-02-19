import { model } from "@medusajs/framework/utils"

const ProductQuestion = model.define("product_question", {
  id: model.id().primaryKey(),
  product_id: model.text().searchable(),
  question: model.text(),
  asked_by: model.text(),
  answer: model.text().nullable(),
  answered_by: model.text().nullable(),
  answered_at: model.text().nullable(),
  is_admin_answer: model.boolean().default(false),
})

export default ProductQuestion
