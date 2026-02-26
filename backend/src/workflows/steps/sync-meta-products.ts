import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MetaClient, readMetaConfig } from "../../lib/meta-client"
import { toMetaProduct } from "../../lib/meta-transformer"
import type { RawMedusaProduct } from "../../lib/meta-transformer"

export type SyncMetaProductsStepInput = {
  products: RawMedusaProduct[]
}

export const syncMetaProductsStep = createStep(
  "sync-meta-products",
  async ({ products }: SyncMetaProductsStepInput, { container }) => {
    const storeService = container.resolve(Modules.STORE) as any

    const config = await readMetaConfig(storeService)
    if (!config) {
      // Meta not configured — TSV feed still works without this step
      return new StepResponse({ synced: 0, skipped: products.length, errors: [] })
    }

    const client = new MetaClient(config.catalogId, config.accessToken)

    // Build Meta payloads for all variants of published products
    const payloads: import("../../lib/meta-client").MetaProduct[] = []
    for (const product of products) {
      if (product.status !== "published") continue
      for (const variant of product.variants || []) {
        payloads.push(toMetaProduct(product, variant))
      }
    }

    if (payloads.length === 0) {
      return new StepResponse({ synced: 0, skipped: 0, errors: [] })
    }

    const { errors } = await client.batchUpsert(payloads)

    // Update sync status in store metadata
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    if (store) {
      const existingMeta = (store.metadata as Record<string, unknown>) || {}
      await storeService.updateStores(store.id, {
        metadata: {
          ...existingMeta,
          meta_sync_status: {
            lastSync: new Date().toISOString(),
            lastSyncProducts: payloads.length,
            lastSyncErrors: errors.length,
            status: errors.length === 0 ? "success" : "error",
            errors: errors.slice(0, 10), // keep last 10 errors
          },
        },
      })
    }

    return new StepResponse({ synced: payloads.length, errors })
  }
)
