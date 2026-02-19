import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  getNotificationsConfig,
  findActiveTemplate,
  renderTemplate,
} from "../lib/notification-utils"

const EVENT_TRIGGER_MAP: Record<string, string> = {
  "order.placed": "order.placed",
  "order.fulfillment_created": "order.fulfillment_created",
  "order.delivery_created": "order.delivery_created",
  "order.cancelled": "order.cancelled",
}

export default async function emailTemplateNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  const triggerEvent = EVENT_TRIGGER_MAP[event.name]
  if (!triggerEvent) return

  const cfg = await getNotificationsConfig(container)
  if (!cfg) return

  const templates: any[] = cfg.emailTemplates ?? []
  const tpl = findActiveTemplate(templates, triggerEvent)
  if (!tpl) return

  // Require SMTP configuration via environment variables
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpUser || !smtpPass) {
    // SMTP not configured — skip silently
    return
  }

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["customer"],
    })
    if (!order?.customer_id) return

    const customerName = order.billing_address?.first_name
      ? `${order.billing_address.first_name} ${order.billing_address.last_name || ""}`.trim()
      : "Valued Customer"

    const displayId = order.display_id || orderId.slice(-6).toUpperCase()

    const vars: Record<string, string> = {
      customer_name: customerName,
      order_id: String(displayId),
      store_name: process.env.STORE_NAME || "VastuCart",
    }

    const subject = renderTemplate(tpl.subject, vars)
    const body = renderTemplate(tpl.body || tpl.name, vars)

    // Get customer email from order
    const customerEmail = order.email
    if (!customerEmail) return

    // Dynamic import to avoid loading nodemailer unless actually needed
    const nodemailer = await import("nodemailer")
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    })

    await transporter.sendMail({
      from: smtpFrom,
      to: customerEmail,
      subject,
      html: body,
    })

    logger.info(`Email sent to ${customerEmail} for ${triggerEvent}`)
  } catch (err: any) {
    logger.warn(`Email notification error for ${triggerEvent}: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    "order.placed",
    "order.fulfillment_created",
    "order.delivery_created",
    "order.cancelled",
  ],
}
