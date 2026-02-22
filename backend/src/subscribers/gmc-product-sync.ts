/**
 * Real-time GMC sync subscriber.
 *
 * Fires on product.created and product.updated — immediately pushes the
 * affected product to Google Merchant Centre via Content API.
 * If GMC is not configured, it exits silently (XML feed still works).
 */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncGmcProductsWorkflow } from "../workflows/sync-gmc-products"

export default async function handleGmcProductSync({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    await syncGmcProductsWorkflow(container).run({
      input: { filters: { id: data.id } },
    })
  } catch (err: any) {
    const logger = container.resolve("logger") as { warn: (msg: string) => void }
    logger.warn(`[gmc-sync] Product ${data.id} sync failed: ${err?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
