import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { LOYALTY_MODULE } from "../modules/loyalty"

// Default config used when no admin config is saved
const DEFAULT_POINTS_PER_RUPEE = 1
const DEFAULT_EXPIRY_DAYS = 30

async function getLoyaltyConfig(container: any): Promise<{
  pointsPerRupee: number
  pointsExpiryDays: number
  programEnabled: boolean
}> {
  try {
    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores?.[0]
    const config = (store?.metadata as any)?.loyalty_config
    if (config) {
      return {
        pointsPerRupee: config.config?.pointsPerRupee ?? DEFAULT_POINTS_PER_RUPEE,
        pointsExpiryDays: config.config?.pointsExpiryDays ?? DEFAULT_EXPIRY_DAYS,
        programEnabled: config.programEnabled !== false,
      }
    }
  } catch {
    // Fallback to defaults
  }
  return {
    pointsPerRupee: DEFAULT_POINTS_PER_RUPEE,
    pointsExpiryDays: DEFAULT_EXPIRY_DAYS,
    programEnabled: true,
  }
}

export default async function orderLoyaltyHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  try {
    const loyaltyConfig = await getLoyaltyConfig(container)

    // If program is disabled, skip
    if (!loyaltyConfig.programEnabled) return

    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId, {
      relations: ["customer"],
    })

    if (!order?.customer_id) return

    const loyaltyService = container.resolve(LOYALTY_MODULE) as any

    if (event.name === "order.placed") {
      // Dynamic rate: total is in paise, divide by 100 for rupees, multiply by pointsPerRupee
      const totalRupees = (order.total || 0) / 100
      const points = Math.floor(totalRupees * loyaltyConfig.pointsPerRupee)
      if (points > 0) {
        const expiresAt = new Date(
          Date.now() + loyaltyConfig.pointsExpiryDays * 24 * 60 * 60 * 1000
        )
        await loyaltyService.addPoints(
          order.customer_id,
          points,
          `Points earned for Order #${order.display_id || orderId.slice(-6).toUpperCase()}`,
          "earned",
          { expires_at: expiresAt, order_id: orderId }
        )
        logger.info(
          `Awarded ${points} loyalty points to customer ${order.customer_id} (expires ${expiresAt.toISOString().slice(0, 10)})`
        )
      }
    } else if (event.name === "order.cancelled") {
      // Reverse any points earned for this order
      const totalRupees = (order.total || 0) / 100
      const points = Math.floor(totalRupees * loyaltyConfig.pointsPerRupee)
      if (points > 0) {
        await loyaltyService.addPoints(
          order.customer_id,
          -points,
          `Points reversed for cancelled Order #${order.display_id || orderId.slice(-6).toUpperCase()}`,
          "adjusted",
          { order_id: orderId }
        )
        logger.info(`Reversed ${points} loyalty points for customer ${order.customer_id}`)
      }
    }
  } catch (err: any) {
    logger.warn(`Loyalty subscriber error: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.cancelled"],
}
