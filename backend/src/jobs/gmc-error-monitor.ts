/**
 * GMC Error Monitor — MTSD Module 5 pattern.
 *
 * Runs daily at 00:30 UTC, calls productstatuses.list to find disapproved items,
 * and stores a summary in store.metadata.gmc_error_report so the admin panel
 * can display current issues without polling Google.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { GmcClient, readGmcConfig } from "../lib/gmc-client"

export default async function gmcErrorMonitorJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void
    warn: (msg: string) => void
  }

  const storeService = container.resolve(Modules.STORE) as any
  const config = await readGmcConfig(storeService)

  if (!config) {
    logger.info("[gmc-monitor] GMC not configured — skipping error check")
    return
  }

  logger.info("[gmc-monitor] Checking GMC product statuses")

  try {
    const client = new GmcClient(config.merchantId, config.serviceAccountKey)
    const { disapproved, total } = await client.listProductStatuses(500)

    const report = {
      checkedAt: new Date().toISOString(),
      totalProducts: total,
      disapprovedCount: disapproved.length,
      disapproved: disapproved.slice(0, 50), // store top 50 issues
    }

    // Persist to store metadata
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    if (store) {
      const existingMeta = (store.metadata as Record<string, unknown>) || {}
      await storeService.updateStores(store.id, {
        metadata: { ...existingMeta, gmc_error_report: report },
      })
    }

    if (disapproved.length > 0) {
      logger.warn(
        `[gmc-monitor] ${disapproved.length} products disapproved in GMC — check /admin/integrations`
      )
    } else {
      logger.info(`[gmc-monitor] All ${total} GMC products healthy`)
    }
  } catch (err: any) {
    logger.warn(`[gmc-monitor] Status check failed: ${err?.message}`)
  }
}

export const config = {
  name: "gmc-error-monitor",
  schedule: "30 0 * * *", // 00:30 UTC daily
}
