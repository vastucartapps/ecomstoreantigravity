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

export default async function whatsappNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  const triggerEvent = EVENT_TRIGGER_MAP[event.name]
  if (!triggerEvent) return

  // WhatsApp Business API credentials via env vars
  const waToken = process.env.WHATSAPP_ACCESS_TOKEN
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!waToken || !waPhoneId) return

  const cfg = await getNotificationsConfig(container)
  if (!cfg?.whatsappConfig?.isEnabled) return

  const tpl = findActiveTemplate(cfg.whatsappConfig.templates ?? [], triggerEvent)
  if (!tpl) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["billing_address"],
    })

    const phone = order?.billing_address?.phone || order?.shipping_address?.phone
    if (!phone) return

    // WhatsApp requires E.164 format
    const e164 = phone.startsWith("+") ? phone : `+${phone}`

    const customerName = order.billing_address?.first_name || "Customer"
    const displayId = order.display_id || orderId.slice(-6).toUpperCase()
    const amount = order.total ? String(Math.round(order.total / 100)) : "0"

    // Brand info is read from admin's store metadata so a single edit in
    // admin storeName updates every WhatsApp message template variable.
    const brand = await fetchBrandFromStore(container)
    const messageText = renderTemplate(tpl.template, {
      customer_name: customerName,
      order_id: String(displayId),
      amount,
      store_name: brand.storeName,
      delivery_date: "soon",
    })

    // Call Meta WhatsApp Cloud API
    const url = `https://graph.facebook.com/v19.0/${waPhoneId}/messages`
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${waToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: e164,
        type: "text",
        text: { body: messageText },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      logger.warn(`WhatsApp API error for ${triggerEvent}: ${err}`)
      return
    }

    logger.info(`WhatsApp message sent to ${e164} for ${triggerEvent}`)
  } catch (err: any) {
    logger.warn(`WhatsApp notification error for ${triggerEvent}: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.fulfillment_created", "order.delivery_created"],
}
