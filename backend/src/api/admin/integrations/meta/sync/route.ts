/**
 * POST /admin/integrations/meta/sync
 *
 * Triggers an immediate full catalog sync to Meta Commerce Catalogue.
 * Admin only. The sync runs asynchronously — poll the status endpoint for progress.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig } from "../../../../../lib/meta-client"
import { syncMetaProductsWorkflow } from "../../../../../workflows/sync-meta-products"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any
  const config = await readMetaConfig(storeService)

  if (!config) {
    return res.status(400).json({
      error: "Meta Catalogue not configured. Connect the integration in the Integrations panel first.",
    })
  }

  // Mark as syncing immediately so admin UI shows progress
  const stores = await storeService.listStores({}, { take: 1 })
  const store = stores?.[0]
  if (store) {
    const existingMeta = (store.metadata as Record<string, unknown>) || {}
    await storeService.updateStores(store.id, {
      metadata: {
        ...existingMeta,
        meta_sync_status: {
          ...(existingMeta.meta_sync_status || {}),
          status: "syncing",
          syncStarted: new Date().toISOString(),
        },
      },
    })
  }

  // Run sync asynchronously (don't await — let admin UI poll status)
  syncMetaProductsWorkflow(req.scope).run({ input: {} }).catch((err: any) => {
    const logger = req.scope.resolve("logger") as { warn: (m: string) => void }
    logger.warn(`[meta-sync] Manual sync failed: ${err?.message}`)
  })

  res.json({ message: "Meta catalogue sync started. Check status endpoint for progress." })
}
