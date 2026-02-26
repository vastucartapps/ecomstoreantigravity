import { model } from "@medusajs/framework/utils"

const SupportTicket = model.define("support_ticket", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  customer_email: model.text(),
  customer_name: model.text(),
  category: model.text(),
  message: model.text(),
  status: model.text().default("open"),       // "open" | "closed"
  admin_reply: model.text().nullable(),
  admin_reply_at: model.dateTime().nullable(),
  admin_reply_by: model.text().nullable(),
})

export default SupportTicket
