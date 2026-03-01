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
  // Images — uploaded to MinIO, up to 3 for carousel
  image_1: model.text().default(""),
  image_2: model.text().default(""),
  image_3: model.text().default(""),
  // Rich content
  what_is_included: model.text().default(""),  // JSON: string[]
  outcomes: model.text().default(""),
  mode: model.text().default("online"),         // online | offline | both
  badge_text: model.text().default(""),         // e.g. "Most Popular"
})

export default BookingServiceType
