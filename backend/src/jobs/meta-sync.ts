/**
 * Full catalog sync to Meta Commerce Catalogue.
 * Runs daily at 03:00 UTC (offset from GMC's 02:00 to avoid concurrent load).
 *
 * The real-time subscribers handle individual product changes immediately.
 * This job is the safety net — re-syncs everything so the Meta catalogue is never stale.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { syncMetaProductsWorkflow } from "../workflows/sync-meta-products"
import { readMetaConfig } from "../lib/meta-client"

export default async function metaFullSyncJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void
    warn: (msg: string) => void
  }

  const storeService = container.resolve(Modules.STORE) as any
  const config = await readMetaConfig(storeService)

  if (!config) {
    logger.info("[meta-sync] Meta Catalogue not configured — skipping full sync")
    return
  }

  logger.info("[meta-sync] Starting daily full catalog sync to Meta Commerce Catalogue")

  try {
    // Sync in batches of 500 products
    const BATCH = 500
    let offset = 0
    let total = 0

    while (true) {
      const result = await syncMetaProductsWorkflow(container).run({
        input: { limit: BATCH, offset },
      })
      const count = (result.result as any)?.count || 0
      total += count
      if (count < BATCH) break
      offset += BATCH
    }

    logger.info(`[meta-sync] Full sync complete — processed ${total} products`)
  } catch (err: any) {
    logger.warn(`[meta-sync] Full sync failed: ${err?.message}`)
  }
}

export const config = {
  name: "meta-full-sync",
  schedule: "0 3 * * *", // 03:00 UTC daily (offset from GMC at 02:00)
}
