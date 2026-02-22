/**
 * POST /admin/integrations/gmc/sync
 *
 * Triggers an immediate full catalog sync to Google Merchant Centre.
 * Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readGmcConfig } from "../../../../../lib/gmc-client"
import { syncGmcProductsWorkflow } from "../../../../../workflows/sync-gmc-products"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any
  const config = await readGmcConfig(storeService)

  if (!config) {
    return res.status(400).json({
      error: "GMC not configured. Connect the integration in the Integrations panel first.",
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
        gmc_sync_status: {
          ...(existingMeta.gmc_sync_status || {}),
          status: "syncing",
          syncStarted: new Date().toISOString(),
        },
      },
    })
  }

  // Run sync asynchronously (don't await — let admin UI poll status)
  syncGmcProductsWorkflow(req.scope).run({ input: {} }).catch((err: any) => {
    const logger = req.scope.resolve("logger") as { warn: (m: string) => void }
    logger.warn(`[gmc-sync] Manual sync failed: ${err?.message}`)
  })

  res.json({ message: "GMC sync started. Check status endpoint for progress." })
}
