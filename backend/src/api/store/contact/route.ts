import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { name, email, phone, subject, message } = req.body as Record<string, string>
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: "name, email, message are required" })
    }

    try {
      const notifService = req.scope.resolve("notificationsModuleService") as any
      await notifService.createNotifications({
        customer_id: "admin",
        type: "contact_form",
        title: "Contact Form: " + (subject || "General Inquiry"),
        body: "From: " + name + " <" + email + ">" + (phone ? " | " + phone : "") + "\n\n" + message,
        is_read: false,
        metadata: JSON.stringify({ name, email, phone, subject, message }),
      })
    } catch {
      // Notification creation is non-blocking
    }

    res.json({ success: true })
  } catch {
    res.status(500).json({ success: false, error: "Failed to submit contact form" })
  }
}
