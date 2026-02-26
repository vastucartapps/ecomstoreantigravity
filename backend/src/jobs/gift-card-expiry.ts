import { MedusaContainer } from "@medusajs/framework/types"
import { GIFT_CARDS_MODULE } from "../modules/gift-cards"

/**
 * Daily job — disable gift cards past their ends_at date.
 * Runs at 01:00 UTC every day.
 */
export default async function giftCardExpiryJob(container: MedusaContainer) {
  const logger = (container as any).resolve("logger")

  try {
    const gcService = (container as any).resolve(GIFT_CARDS_MODULE)

    // Find active cards that have passed their expiry
    const [expired] = await gcService.listAndCountGiftCards(
      { is_disabled: false },
      { take: 500 }
    ).catch(() => [[], 0])

    const now = new Date()
    const toDisable = (expired as any[]).filter(
      (gc) => gc.ends_at && new Date(gc.ends_at) < now
    )

    if (toDisable.length === 0) {
      logger.info("Gift card expiry job: no expired cards found")
      return
    }

    for (const gc of toDisable) {
      await gcService.updateGiftCards({ id: gc.id, is_disabled: true })
    }

    logger.info(`Gift card expiry job: disabled ${toDisable.length} expired card(s)`)
  } catch (err: any) {
    logger.warn(`Gift card expiry job error: ${err.message}`)
  }
}

export const config = {
  name: "gift-card-expiry",
  schedule: "0 1 * * *", // 01:00 UTC daily
}
