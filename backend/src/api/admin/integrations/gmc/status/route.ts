/**
 * GET /admin/integrations/gmc/status
 *
 * Returns current GMC sync status and error report from store metadata.
 * Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readGmcConfig } from "../../../../../lib/gmc-client"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any

  const config = await readGmcConfig(storeService)
  const stores = await storeService.listStores({}, { take: 1 })
  const store = stores?.[0]
  const meta = (store?.metadata as Record<string, unknown>) || {}

  const syncStatus = (meta.gmc_sync_status as Record<string, unknown>) || null
  const errorReport = (meta.gmc_error_report as Record<string, unknown>) || null

  res.json({
    isConfigured: !!config,
    merchantId: config?.merchantId || null,
    feedUrl: `${process.env.BACKEND_URL || "https://sapi.vastucart.in"}/store/gmc-feed`,
    syncStatus,
    errorReport,
  })
}
