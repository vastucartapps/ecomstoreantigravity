/**
 * Daily sitemap (re)submission to Google Search Console.
 *
 * Runs at 03:30 UTC. When GSC is configured (admin-pasted service account),
 * (re)submits the storefront sitemap so Google re-reads lastmod and discovers
 * catalog changes promptly. No-op when GSC is not configured. Also available
 * on-demand via the admin dashboard's "Submit sitemap" button.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { GscClient, readGscConfig } from "../lib/gsc-client"

export default async function gscSitemapSubmitJob(container: MedusaContainer) {
  const logger = container.resolve("logger") as {
    info: (m: string) => void
    warn: (m: string) => void
  }

  const storeService = container.resolve(Modules.STORE) as any
  const config = await readGscConfig(storeService)
  if (!config) {
    logger.info("[gsc-sitemap] GSC not configured — skipping sitemap submission")
    return
  }

  const storeUrl = (process.env.STORE_URL || "https://store.vastucart.in").replace(/\/$/, "")
  const sitemapUrl = `${storeUrl}/sitemap.xml`

  try {
    const client = new GscClient(config.siteUrl, config.serviceAccountKey)
    await client.submitSitemap(sitemapUrl)
    logger.info(`[gsc-sitemap] Submitted ${sitemapUrl} to Search Console`)
  } catch (err: any) {
    logger.warn(`[gsc-sitemap] Submission failed: ${err?.message}`)
  }
}

export const config = {
  name: "gsc-sitemap-submit", // required by Medusa v2 JobLoader
  schedule: "30 3 * * *", // 03:30 UTC daily
}
