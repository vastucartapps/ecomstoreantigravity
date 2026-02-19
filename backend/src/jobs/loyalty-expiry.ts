import { MedusaContainer } from "@medusajs/framework/types"
import { LOYALTY_MODULE } from "../modules/loyalty"

export default async function loyaltyExpiryJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as any
  const loyaltyService = container.resolve(LOYALTY_MODULE) as any

  try {
    const expiredCount = await loyaltyService.expirePoints()
    if (expiredCount > 0) {
      logger.info(
        `Loyalty expiry job: expired ${expiredCount} transaction(s)`
      )
    }
  } catch (err: any) {
    logger.error(`Loyalty expiry job failed: ${err.message}`)
  }
}

export const config = {
  name: "loyalty-points-expiry",
  schedule: "0 2 * * *", // Daily at 2 AM
}
