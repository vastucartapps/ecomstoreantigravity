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

  // BACKEND_URL is enforced by env-validation in production; in dev it falls
  // back to the local listener so the admin UI still renders something useful.
  const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"

  res.json({
    isConfigured: !!config,
    merchantId: config?.merchantId || null,
    feedUrl: `${backendUrl}/store/gmc-feed`,
    syncStatus,
    errorReport,
  })
}
