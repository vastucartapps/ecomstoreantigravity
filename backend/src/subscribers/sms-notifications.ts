import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  getNotificationsConfig,
  findActiveTemplate,
  renderTemplate,
} from "../lib/notification-utils"
import { fetchBrandFromStore } from "../lib/brand-from-store"

const EVENT_TRIGGER_MAP: Record<string, string> = {
  "order.placed": "order.placed",
  "order.fulfillment_created": "order.fulfillment_created",
  "order.delivery_created": "order.delivery_created",
}

export default async function smsNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  const triggerEvent = EVENT_TRIGGER_MAP[event.name]
  if (!triggerEvent) return

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) return // Twilio not configured

  const cfg = await getNotificationsConfig(container)
  if (!cfg?.smsConfig?.isEnabled) return

  const tpl = findActiveTemplate(cfg.smsConfig.templates ?? [], triggerEvent)
  if (!tpl) return

  const senderId = cfg.smsConfig.senderId
  if (!senderId) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["billing_address"],
    })

    const phone = order?.billing_address?.phone || order?.shipping_address?.phone
    if (!phone) return

    const customerName = order.billing_address?.first_name || "Customer"
    const displayId = order.display_id || orderId.slice(-6).toUpperCase()

    const brand = await fetchBrandFromStore(container)
    const message = renderTemplate(tpl.template, {
      customer_name: customerName,
      order_id: String(displayId),
      amount: order.total ? String(Math.round(order.total / 100)) : "0",
      store_name: brand.storeName,
    })

    // Dynamic import
    const twilio = await import("twilio")
    const client = twilio.default(accountSid, authToken)

    await client.messages.create({
      body: message,
      from: senderId,
      to: phone,
    })

    logger.info(`SMS sent to ${phone} for ${triggerEvent}`)
  } catch (err: any) {
    logger.warn(`SMS notification error for ${triggerEvent}: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.fulfillment_created", "order.delivery_created"],
}
