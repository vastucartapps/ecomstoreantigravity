/**
 * Real-time Meta catalogue delete subscriber.
 *
 * Fires on product.deleted — immediately removes all product variants from
 * Meta Commerce Catalogue. The retailer_id is variant.sku (same as during insert).
 * Falls back to handle_variantId if sku is absent.
 */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { MetaClient, readMetaConfig } from "../lib/meta-client"

export default async function handleMetaProductDelete({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; variants?: { id: string; sku?: string }[]; handle?: string }>) {
  try {
    const storeService = container.resolve(Modules.STORE) as any
    const config = await readMetaConfig(storeService)
    if (!config) return

    const client = new MetaClient(config.catalogId, config.accessToken)

    // data.variants may be included in the event payload depending on Medusa version
    const variants = data.variants || []
    if (variants.length === 0) {
      const logger = container.resolve("logger") as { warn: (m: string) => void }
      logger.warn(`[meta-delete] No variant info for product ${data.id} — cannot remove from Meta`)
      return
    }

    for (const v of variants) {
      const retailerId = v.sku || `${data.handle}_${v.id}`
      await client.deleteProduct(retailerId).catch(() => {
        // Already gone — ignore
      })
    }
  } catch (err: any) {
    const logger = container.resolve("logger") as { warn: (msg: string) => void }
    logger.warn(`[meta-delete] Failed for product ${data.id}: ${err?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.deleted"],
}
