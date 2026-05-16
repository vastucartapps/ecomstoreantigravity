/**
 * GET /admin/integrations/meta/status
 *
 * Returns current Meta catalogue sync status and diagnostics from store metadata.
 * Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig } from "../../../../../lib/meta-client"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any

  const config = await readMetaConfig(storeService)
  const stores = await storeService.listStores({}, { take: 1 })
  const store = stores?.[0]
  const meta = (store?.metadata as Record<string, unknown>) || {}

  const syncStatus = (meta.meta_sync_status as Record<string, unknown>) || null
  const errorReport = (meta.meta_error_report as Record<string, unknown>) || null

  // Feed URL is served from the backend (sapi) not the storefront.
  // BACKEND_URL is enforced by env-validation in production.
  const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"
  const feedUrl = `${backendUrl}/store/meta-feed`

  res.json({
    isConfigured: !!config,
    catalogId: config?.catalogId || null,
    feedUrl,
    syncStatus,
    errorReport,
  })
}
