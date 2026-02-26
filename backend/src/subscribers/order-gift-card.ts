import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { GIFT_CARDS_MODULE } from "../modules/gift-cards"

/**
 * On order.placed: if the order's metadata contains a gift card application,
 * deduct the amount from the gift card balance and log the transaction.
 *
 * Cart provider stores: cart.metadata.gift_card_code, gift_card_id, gift_card_deduct_amount
 * Medusa copies cart.metadata → order.metadata on cart.complete()
 */
export default async function orderGiftCardHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as any
  const orderId = event.data?.id
  if (!orderId) return

  try {
    const orderService = container.resolve("orderModuleService") as any
    const order = await orderService.retrieveOrder(orderId)

    const meta = (order.metadata as any) || {}
    const gcCode: string | undefined = meta.gift_card_code
    const gcDeduct: number | undefined = meta.gift_card_deduct_amount

    if (!gcCode || !gcDeduct || gcDeduct <= 0) return

    const gcService = container.resolve(GIFT_CARDS_MODULE) as any
    const [gcs] = await gcService.listAndCountGiftCards(
      { code: gcCode.toUpperCase() },
      { take: 1 }
    ).catch(() => [[], 0])

    const gc = (gcs as any[])[0]
    if (!gc) {
      logger.warn(`Gift card ${gcCode} not found for order ${orderId}`)
      return
    }

    const deductAmount = Math.min(gc.balance, Math.round(gcDeduct))
    if (deductAmount <= 0) return

    // Read existing transactions
    let transactions: any[] = []
    try { transactions = JSON.parse(gc.metadata_json || "{}").transactions || [] } catch {}

    const newTx = {
      id: crypto.randomUUID(),
      type: "debit",
      amount: deductAmount,
      currency: gc.currency_code.toUpperCase(),
      description: `Applied to order #${order.display_id || orderId.slice(-6).toUpperCase()}`,
      orderId,
      date: new Date().toISOString(),
    }
    transactions.push(newTx)

    const newBalance = Math.max(0, gc.balance - deductAmount)

    await gcService.updateGiftCards({
      id: gc.id,
      balance: newBalance,
      metadata_json: JSON.stringify({ transactions }),
    })

    logger.info(
      `Gift card ${gc.code}: deducted ${deductAmount / 100} ${gc.currency_code.toUpperCase()}, new balance: ${newBalance / 100}`
    )
  } catch (err: any) {
    logger.warn(`Gift card subscriber error for order ${orderId}: ${err.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed"],
}
