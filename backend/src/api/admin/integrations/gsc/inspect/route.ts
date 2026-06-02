/**
 * GET /admin/integrations/gsc/inspect?url=<pageUrl>
 *
 * URL Inspection API — returns Google's index status for a single page.
 * Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { GscClient, readGscConfig } from "../../../../../lib/gsc-client"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any
  const config = await readGscConfig(storeService)

  if (!config) {
    return res.status(400).json({ error: "GSC not configured." })
  }

  const pageUrl = (req.query?.url as string) || ""
  if (!pageUrl) {
    return res.status(400).json({ error: "Missing ?url= query parameter." })
  }

  try {
    const client = new GscClient(config.siteUrl, config.serviceAccountKey)
    const inspection = await client.inspectUrl(pageUrl)
    res.json({ url: pageUrl, inspection, error: null })
  } catch (err: any) {
    res.status(502).json({ url: pageUrl, inspection: null, error: err?.message || "GSC inspect failed" })
  }
}
