/**
 * Meta Catalogue Diagnostics Monitor.
 *
 * Runs daily at 01:00 UTC (offset from GMC monitor at 00:30).
 * Calls the Meta catalogue diagnostics endpoint to find items with errors or warnings,
 * and stores a summary in store.metadata.meta_error_report so the admin panel
 * can display current issues without polling Meta on every page load.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MetaClient, readMetaConfig } from "../lib/meta-client"

export default async function metaErrorMonitorJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as {
    info: (msg: string) => void
    warn: (msg: string) => void
  }

  const storeService = container.resolve(Modules.STORE) as any
  const config = await readMetaConfig(storeService)

  if (!config) {
    logger.info("[meta-monitor] Meta Catalogue not configured — skipping diagnostics check")
    return
  }

  logger.info("[meta-monitor] Checking Meta catalogue diagnostics")

  try {
    const client = new MetaClient(config.catalogId, config.accessToken)
    const { warnings, total } = await client.getCatalogDiagnostics()

    const report = {
      checkedAt: new Date().toISOString(),
      totalItems: total,
      errorCount: warnings.length,
      warnings: warnings.slice(0, 50), // store top 50 issues
    }

    // Persist to store metadata
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    if (store) {
      const existingMeta = (store.metadata as Record<string, unknown>) || {}
      await storeService.updateStores(store.id, {
        metadata: { ...existingMeta, meta_error_report: report },
      })
    }

    if (warnings.length > 0) {
      logger.warn(
        `[meta-monitor] ${warnings.length} catalogue items have issues in Meta — check /admin/integrations`
      )
    } else {
      logger.info(`[meta-monitor] Meta catalogue diagnostics clean — ${total} total items`)
    }
  } catch (err: any) {
    logger.warn(`[meta-monitor] Diagnostics check failed: ${err?.message}`)
  }
}

export const config = {
  name: "meta-error-monitor",
  schedule: "0 1 * * *", // 01:00 UTC daily (offset from GMC monitor at 00:30)
}
