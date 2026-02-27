import { model } from "@medusajs/framework/utils"

const BookingServiceType = model.define("booking_service_type", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().default(""),
  duration_minutes: model.number().default(45),
  price: model.number().default(0),
  currency: model.text().default("INR"),
  is_active: model.boolean().default(true),
  display_order: model.number().default(0),
})

export default BookingServiceType
