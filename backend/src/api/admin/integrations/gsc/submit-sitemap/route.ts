/**
 * POST /admin/integrations/gsc/submit-sitemap
 *
 * Submits (or re-submits) the storefront sitemap to Google Search Console.
 * Body: { sitemapUrl?: string } — defaults to {STORE_URL}/sitemap.xml.
 * Admin only.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { GscClient, readGscConfig } from "../../../../../lib/gsc-client"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const storeService = req.scope.resolve(Modules.STORE) as any
  const config = await readGscConfig(storeService)

  if (!config) {
    return res.status(400).json({
      error:
        "GSC not configured. Connect Google Search Console in the Integrations panel first.",
    })
  }

  const storeUrl = process.env.STORE_URL || "https://store.vastucart.in"
  const sitemapUrl =
    (req.body as { sitemapUrl?: string })?.sitemapUrl || `${storeUrl}/sitemap.xml`

  try {
    const client = new GscClient(config.siteUrl, config.serviceAccountKey)
    await client.submitSitemap(sitemapUrl)
    res.json({ message: "Sitemap submitted to Google Search Console.", sitemapUrl })
  } catch (err: any) {
    res.status(502).json({ error: err?.message || "GSC submitSitemap failed", sitemapUrl })
  }
}
