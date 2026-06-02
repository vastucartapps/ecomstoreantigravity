/**
 * GET /admin/integrations/gsc/status
 *
 * Returns Google Search Console connection status + registered sitemaps.
 * Never returns the service-account key. Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { GscClient, readGscConfig } from "../../../../../lib/gsc-client"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any
  const config = await readGscConfig(storeService)

  if (!config) {
    res.json({ isConfigured: false, siteUrl: null, sitemaps: [], error: null })
    return
  }

  try {
    const client = new GscClient(config.siteUrl, config.serviceAccountKey)
    const sitemaps = await client.listSitemaps()
    res.json({
      isConfigured: true,
      siteUrl: config.siteUrl,
      hasVerificationToken: !!config.verificationToken,
      sitemaps,
      error: null,
    })
  } catch (err: any) {
    res.json({
      isConfigured: true,
      siteUrl: config.siteUrl,
      hasVerificationToken: !!config.verificationToken,
      sitemaps: [],
      error: err?.message || "GSC API error",
    })
  }
}
