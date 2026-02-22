/**
 * Full catalog sync to Google Merchant Centre.
 * Runs daily at 02:00 UTC to catch any products missed by real-time subscribers.
 *
 * The real-time subscribers handle individual product changes immediately.
 * This job is the safety net — re-syncs everything so GMC is never stale.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { syncGmcProductsWorkflow } from "../workflows/sync-gmc-products"
import { readGmcConfig } from "../lib/gmc-client"

export default async function gmcFullSyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void
    warn: (msg: string) => void
  }

  const storeService = container.resolve(Modules.STORE) as any
  const config = await readGmcConfig(storeService)

  if (!config) {
    logger.info("[gmc-sync] GMC not configured — skipping full sync")
    return
  }

  logger.info("[gmc-sync] Starting daily full catalog sync to GMC")

  try {
    // Sync in batches of 500 products
    const BATCH = 500
    let offset = 0
    let total = 0

    while (true) {
      const result = await syncGmcProductsWorkflow(container).run({
        input: { limit: BATCH, offset },
      })
      const count = (result.result as any)?.count || 0
      total += count
      if (count < BATCH) break
      offset += BATCH
    }

    logger.info(`[gmc-sync] Full sync complete — processed ${total} products`)
  } catch (err: any) {
    logger.warn(`[gmc-sync] Full sync failed: ${err?.message}`)
  }
}

export const config = {
  name: "gmc-full-sync",
  schedule: "0 2 * * *", // 02:00 UTC daily
}
