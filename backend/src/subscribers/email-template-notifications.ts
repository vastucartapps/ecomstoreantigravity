import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendTransactional, isListmonkConfigured } from "../lib/listmonk-client"

function fmt(n: number): string {
  return `₹${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
}

function addDays(d: Date, n: number): string {
  const dt = new Date(d)
  dt.setDate(dt.getDate() + n)
  return fmtDate(dt)
}

function buildOrderId(order: any): string {
  if (order.display_id) {
    const y = new Date(order.created_at).getFullYear()
    const mmdd = new Date(order.created_at)
      .toLocaleDateString("en-IN", { month: "2-digit", day: "2-digit" })
      .replace(/\//g, "")
    return `VC-${y}-${mmdd}-${String(order.display_id).padStart(4, "0")}`
  }
  return order.id?.slice(-8).toUpperCase() || "UNKNOWN"
}

function buildItemsSummary(items: any[]): { count: string; summary: string } {
  if (!items?.length) return { count: "0 items", summary: "No items" }
  const count = `${items.length} item${items.length !== 1 ? "s" : ""}`
  const names = items
    .slice(0, 3)
    .map((i: any) => `${i.title || i.variant_title || "Product"} (×${i.quantity || 1})`)
  const summary =
    names.join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : "")
  return { count, summary }
}

function buildShipping(order: any): { name: string; address: string } {
  const a = order.shipping_address
  if (!a) return { name: "Not specified", address: "Not specified" }
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ") || "Customer"
  const address = [a.address_1, a.address_2, a.city, a.province, a.postal_code]
    .filter(Boolean)
    .join(", ")
  return { name, address }
}

export default async function emailTemplateNotificationsHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  if (!isListmonkConfigured()) {
    logger.debug("Listmonk not configured – skipping email notification")
    return
  }

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["items", "shipping_address", "billing_address", "fulfillments"],
    })
    if (!order) return

    const customerEmail = order.email
    if (!customerEmail) {
      logger.warn(`[email-notifications] No email on order ${orderId}`)
      return
    }

    const billing = order.billing_address
    const customerName = billing?.first_name
      ? [billing.first_name, billing.last_name].filter(Boolean).join(" ")
      : "Valued Customer"

    const orderId2 = buildOrderId(order)
    const orderDate = fmtDate(order.created_at)
    const orderTotal = fmt(order.total || 0)
    const { count: itemsCount, summary: itemsSummary } = buildItemsSummary(order.items || [])
    const { name: shippingName, address: shippingAddress } = buildShipping(order)

    const storeUrl = process.env.STORE_URL || "https://store.vastucart.in"
    const orderUrl = `${storeUrl}/account/orders/${orderId}`
    const supportEmail = process.env.SUPPORT_EMAIL || "support@vastucart.in"

    const base = {
      customer_name: customerName,
      order_id: orderId2,
      order_date: orderDate,
      order_total: orderTotal,
      items_count: itemsCount,
      items_summary: itemsSummary,
      store_url: storeUrl,
      order_url: orderUrl,
      support_email: supportEmail,
    }

    // ── ORDER PLACED ──────────────────────────────────────────────────────────
    if (event.name === "order.placed") {
      const paymentMethod = "Online Payment" // simplified; provider can be added later
      await sendTransactional({
        email: customerEmail,
        name: customerName,
        templateName: "VC Order Confirmed",
        subject: `Order #${orderId2} confirmed – thank you, ${customerName}!`,
        data: {
          ...base,
          shipping_name: shippingName,
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
        },
      })
      logger.info(`[email-notifications] Order confirmed email → ${customerEmail}`)
      return
    }

    // ── ORDER SHIPPED (fulfillment_created) ───────────────────────────────────
    if (event.name === "order.fulfillment_created") {
      const fulfillment = (order.fulfillments || [])[0]
      const trackingLink = (fulfillment?.tracking_links || [])[0]
      const trackingNumber = trackingLink?.tracking_number || "Tracking update coming soon"
      const trackingUrl = trackingLink?.url || orderUrl
      const carrier = (fulfillment?.provider_id || "our courier partner")
        .replace("fp_", "")
        .replace(/_/g, " ")
      const estimatedDelivery = addDays(new Date(), 5)

      await sendTransactional({
        email: customerEmail,
        name: customerName,
        templateName: "VC Order Shipped",
        subject: `Your VastuCart order #${orderId2} is on its way! 🚚`,
        data: {
          ...base,
          tracking_number: trackingNumber,
          tracking_url: trackingUrl,
          carrier: carrier,
          estimated_delivery: estimatedDelivery,
        },
      })
      logger.info(`[email-notifications] Order shipped email → ${customerEmail}`)
      return
    }

    // ── ORDER DELIVERED ───────────────────────────────────────────────────────
    if (event.name === "order.delivery_created") {
      const loyaltyPoints = String(Math.floor((order.total || 0) / 10000))
      const reviewUrl = `${storeUrl}/account/orders/${orderId}?review=1`

      await sendTransactional({
        email: customerEmail,
        name: customerName,
        templateName: "VC Order Delivered",
        subject: `Your VastuCart order #${orderId2} has arrived! ✦`,
        data: {
          ...base,
          loyalty_points: loyaltyPoints,
          review_url: reviewUrl,
        },
      })
      logger.info(`[email-notifications] Order delivered email → ${customerEmail}`)
      return
    }

    // ── ORDER CANCELLED ───────────────────────────────────────────────────────
    if (event.name === "order.cancelled") {
      const refundAmount = fmt(order.total || 0)
      const refundTimeline = "5–7 business days to your original payment method"

      await sendTransactional({
        email: customerEmail,
        name: customerName,
        templateName: "VC Order Cancelled",
        subject: `Your VastuCart order #${orderId2} has been cancelled`,
        data: {
          ...base,
          refund_amount: refundAmount,
          refund_timeline: refundTimeline,
        },
      })
      logger.info(`[email-notifications] Order cancelled email → ${customerEmail}`)
      return
    }
  } catch (err: any) {
    logger.warn(`[email-notifications] Failed for ${event.name} / ${orderId}: ${err.message}`)
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
