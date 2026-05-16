import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Length caps prevent payload-bombing the notifications table and keep the
// admin inbox readable. Numbers picked to be generous for legitimate use.
const LIMITS = {
  name: 120,
  email: 254, // RFC 5321
  phone: 32,
  subject: 200,
  message: 5000,
} as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as Record<string, unknown>
    const name = clean(body.name, LIMITS.name)
    const email = clean(body.email, LIMITS.email)
    const phone = clean(body.phone, LIMITS.phone)
    const subject = clean(body.subject, LIMITS.subject)
    const message = clean(body.message, LIMITS.message)

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "name, email, message are required" })
    }
    if (!EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: "email is not a valid address" })
    }

    try {
      const notifService = req.scope.resolve("notificationsModuleService") as any
      await notifService.createNotifications({
        customer_id: "admin",
        type: "contact_form",
        title: "Contact Form: " + (subject || "General Inquiry"),
        body:
          "From: " +
          name +
          " <" +
          email +
          ">" +
          (phone ? " | " + phone : "") +
          "\n\n" +
          message,
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
