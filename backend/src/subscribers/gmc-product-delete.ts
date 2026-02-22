/**
 * Real-time GMC delete subscriber.
 *
 * Fires on product.deleted — immediately removes all product variants from
 * Google Merchant Centre. The offerId is variant.sku (same as during insert).
 * Falls back to handle_variantId if sku is absent.
 */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { GmcClient, readGmcConfig } from "../lib/gmc-client"

export default async function handleGmcProductDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; variants?: { id: string; sku?: string; metadata?: Record<string,unknown> }[]; handle?: string }>) {
  try {
    const storeService = container.resolve(Modules.STORE) as any
    const config = await readGmcConfig(storeService)
    if (!config) return

    const client = new GmcClient(config.merchantId, config.serviceAccountKey)

    // data.variants may be included in the event payload depending on Medusa version
    const variants = data.variants || []
    if (variants.length === 0) {
      // Best effort: can't delete without knowing the offerId
      const logger = container.resolve("logger") as { warn: (m: string) => void }
      logger.warn(`[gmc-delete] No variant info for product ${data.id} — cannot remove from GMC`)
      return
    }

    for (const v of variants) {
      const offerId = v.sku || `${data.handle}_${v.id}`
      await client.deleteProduct(offerId).catch(() => {
        // Already gone — ignore
      })
    }
  } catch (err: any) {
    const logger = container.resolve("logger") as { warn: (msg: string) => void }
    logger.warn(`[gmc-delete] Failed for product ${data.id}: ${err?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.deleted"],
}
