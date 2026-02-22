import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { GmcClient, readGmcConfig } from "../../lib/gmc-client"
import { toGmcPayload } from "../../lib/gmc-transformer"
import type { RawMedusaProduct } from "../../lib/gmc-transformer"

export type SyncGmcProductsStepInput = {
  products: RawMedusaProduct[]
}

export const syncGmcProductsStep = createStep(
  "sync-gmc-products",
  async ({ products }: SyncGmcProductsStepInput, { container }) => {
    const storeService = container.resolve(Modules.STORE) as any

    const config = await readGmcConfig(storeService)
    if (!config) {
      // GMC not configured — XML feed still works without this step
      return new StepResponse({ synced: 0, skipped: products.length, errors: [] })
    }

    const client = new GmcClient(config.merchantId, config.serviceAccountKey)

    // Build GMC payloads for all variants of published products
    const payloads: import("../../lib/gmc-transformer").GmcProduct[] = []
    for (const product of products) {
      if (product.status !== "published") continue
      for (const variant of product.variants || []) {
        payloads.push(toGmcPayload(product, variant))
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
          gmc_sync_status: {
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
