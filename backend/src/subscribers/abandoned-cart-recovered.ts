import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ABANDONED_CART_RECOVERY_MODULE } from "../modules/abandoned-cart-recovery"

/**
 * When an order is placed, check if its cart had a pending recovery attempt
 * (stamped on cart.metadata by the abandoned-cart-recovery job). If so,
 * mark all matching recovery rows as recovered with the order id + amount.
 *
 * Attribution: the job writes abandoned_cart_recovery.token to cart.metadata,
 * and Medusa copies cart.metadata → order.metadata on cart.complete(). We
 * look up the recovery row by token and flag its cart's rows as recovered.
 */
export default async function abandonedCartRecoveredHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId)

    const meta = (order?.metadata as Record<string, unknown>) || {}
    const recovery = meta.abandoned_cart_recovery as
      | { token?: string; stage?: number }
      | undefined

    if (!recovery?.token) return

    const recoveryService = container.resolve(ABANDONED_CART_RECOVERY_MODULE) as any

    const row = await recoveryService.findByToken(recovery.token)
    if (!row) {
      logger.debug(`[abandoned-cart-recovered] No recovery row for token on order ${orderId}`)
      return
    }

    const updated = await recoveryService.markRecovered(
      row.cart_id,
      orderId,
      order.total || 0
    )

    logger.info(
      `[abandoned-cart-recovered] Order ${orderId} credited to recovery (cart ${row.cart_id}, ${updated} row(s) flagged)`
    )
  } catch (err: any) {
    logger.warn(`[abandoned-cart-recovered] subscriber error: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
}
