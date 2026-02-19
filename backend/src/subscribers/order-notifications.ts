import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { NOTIFICATIONS_MODULE } from "../modules/notifications"
import type { INotificationsService } from "../lib/service-types"

const EVENT_MAP: Record<string, { title: string; getMessage: (displayId: any) => string; type: "order" }> = {
  "order.placed": {
    title: "Order Placed Successfully",
    getMessage: (id) => `Your order #${id} has been placed and is being processed.`,
    type: "order",
  },
  "order.fulfillment_created": {
    title: "Order Shipped",
    getMessage: (id) => `Your order #${id} has been shipped and is on its way!`,
    type: "order",
  },
  "order.delivery_created": {
    title: "Order Delivered",
    getMessage: (id) => `Your order #${id} has been delivered. Enjoy your purchase!`,
    type: "order",
  },
}

export default async function orderNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  const eventConfig = EVENT_MAP[event.name]
  if (!eventConfig) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId)

    if (!order?.customer_id) return

    const notificationsService = container.resolve(NOTIFICATIONS_MODULE) as INotificationsService
    const displayId = order.display_id || orderId.slice(-6).toUpperCase()

    await notificationsService.createNotification({
      customer_id: order.customer_id,
      type: "order",
      title: eventConfig.title,
      message: eventConfig.getMessage(displayId),
      link: `/account/orders/${orderId}`,
    })

    logger.info(`Created ${eventConfig.title} notification for customer ${order.customer_id}`)
  } catch (err: any) {
    logger.warn(`Order notification subscriber error: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.fulfillment_created", "order.delivery_created"],
}
