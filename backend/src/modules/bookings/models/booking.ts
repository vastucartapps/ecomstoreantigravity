import { model } from "@medusajs/framework/utils"

const Booking = model.define("booking", {
  id: model.id().primaryKey(),
  customer_id: model.text().searchable(),
  title: model.text(),
  consultant_name: model.text().default(""),
  date: model.text(),
  time: model.text(),
  status: model.enum(["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  meeting_link: model.text().default(""),
  price: model.number().default(0),
  currency: model.text().default("INR"),
  notes: model.text().default(""),
})

export default Booking
