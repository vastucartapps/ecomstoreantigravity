/**
 * Real-time Meta catalogue sync subscriber.
 *
 * Fires on product.created and product.updated — immediately pushes the
 * affected product to Meta Commerce Catalogue via the Graph API items_batch endpoint.
 * If Meta is not configured, exits silently (TSV feed still works independently).
 */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { syncMetaProductsWorkflow } from "../workflows/sync-meta-products"

export default async function handleMetaProductSync({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    await syncMetaProductsWorkflow(container).run({
      input: { filters: { id: data.id } },
    })
  } catch (err: any) {
    const logger = container.resolve("logger") as { warn: (msg: string) => void }
    logger.warn(`[meta-sync] Product ${data.id} sync failed: ${err?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated"],
}
