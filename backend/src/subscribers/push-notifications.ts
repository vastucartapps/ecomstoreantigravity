import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import {
  getNotificationsConfig,
  findActiveTemplate,
  renderTemplate,
} from "../lib/notification-utils"
import { PUSH_SUBSCRIPTIONS_MODULE } from "../modules/push-subscriptions"

const EVENT_TRIGGER_MAP: Record<string, string> = {
  "order.placed": "order.placed",
  "order.fulfillment_created": "order.fulfillment_created",
  "order.delivery_created": "order.delivery_created",
}

export default async function pushNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  const triggerEvent = EVENT_TRIGGER_MAP[event.name]
  if (!triggerEvent) return

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@vastucart.com"

  if (!vapidPublicKey || !vapidPrivateKey) return

  const cfg = await getNotificationsConfig(container)
  if (!cfg?.pushConfig?.isEnabled) return

  const tpl = findActiveTemplate(cfg.pushConfig.templates ?? [], triggerEvent)
  if (!tpl) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId)
    if (!order?.customer_id) return

    const displayId = order.display_id || orderId.slice(-6).toUpperCase()
    const amount = order.total ? String(Math.round(order.total / 100)) : "0"

    const body = renderTemplate(tpl.template, {
      customer_name: "Customer",
      order_id: String(displayId),
      amount,
      order_status: order.status,
      store_name: process.env.STORE_NAME || "VastuCart",
    })

    const pushSvc = container.resolve(PUSH_SUBSCRIPTIONS_MODULE) as any
    const subscriptions = await pushSvc.listPushSubscriptions(
      { customer_id: order.customer_id },
      { take: 20 }
    )

    if (!subscriptions?.length) return

    const webpush = await import("web-push")
    webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const payload = JSON.stringify({
      title: tpl.name,
      body,
      url: `/account/orders/${orderId}`,
    })

    const sends = subscriptions.map(async (sub: any) => {
      try {
        await webpush.default.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      } catch (err: any) {
        // 410 Gone = subscription expired, clean up
        if (err.statusCode === 410) {
          await pushSvc.deletePushSubscription(sub.id).catch(() => {})
        }
      }
    })

    await Promise.allSettled(sends)
    logger.info(`Push sent to ${subscriptions.length} subscription(s) for ${triggerEvent}`)
  } catch (err: any) {
    logger.warn(`Push notification error for ${triggerEvent}: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.fulfillment_created", "order.delivery_created"],
}
