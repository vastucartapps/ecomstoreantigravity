/**
 * GET /admin/analytics/gsc
 *
 * Returns Search Console Search Analytics for the storefront property:
 * top queries, top pages, and overall totals (clicks / impressions / CTR /
 * avg position). Reads siteUrl + serviceAccountKey from store metadata
 * (integrations_config.integrations[id="gsc"].configFields).
 *
 * Query params:
 *   ?days=28  — lookback window (1–90), data lags ~3 days
 */
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { GscClient, readGscConfig } from "../../../../lib/gsc-client"

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const config = await readGscConfig(storeService)

    if (!config) {
      res.json({ isConfigured: false, report: null, error: null })
      return
    }

    const days = Math.min(90, Math.max(1, parseInt((req.query?.days as string) || "28", 10)))
    const client = new GscClient(config.siteUrl, config.serviceAccountKey)

    const [byQuery, byPage, byDate] = await Promise.all([
      client.searchAnalyticsQuery({ days, dimensions: ["query"], rowLimit: 25 }),
      client.searchAnalyticsQuery({ days, dimensions: ["page"], rowLimit: 25 }),
      client.searchAnalyticsQuery({ days, dimensions: ["date"], rowLimit: 90 }),
    ])

    res.json({
      isConfigured: true,
      report: {
        days,
        totals: byQuery.totals,
        topQueries: byQuery.rows,
        topPages: byPage.rows,
        trend: byDate.rows,
      },
      error: null,
    })
  } catch (err: any) {
    res.json({ isConfigured: true, report: null, error: err?.message || "GSC API error" })
  }
}
