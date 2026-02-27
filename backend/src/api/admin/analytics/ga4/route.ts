import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { GA4Client, readGA4Config } from "../../../../lib/ga4-client"

/**
 * GET /admin/analytics/ga4
 *
 * Returns GA4 analytics report for the last 30 days.
 * Reads propertyId + serviceAccountKey from store metadata
 * (integrations_config.integrations[id="ga4"].configFields).
 *
 * Query params:
 *   ?days=30  — override lookback window (1–90)
 */
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Resolve store service to read config
    const storeModuleService = req.scope.resolve("store") as any

    const ga4Config = await readGA4Config(storeModuleService)

    if (!ga4Config) {
      res.json({
        isConfigured: false,
        report: null,
        error: null,
      })
      return
    }

    const days = Math.min(90, Math.max(1, parseInt((req.query?.days as string) || "30", 10)))

    const client = new GA4Client(ga4Config.propertyId, ga4Config.serviceAccountKey)
    const report = await client.runReport(days)

    res.json({
      isConfigured: true,
      report,
      error: null,
    })
  } catch (err: any) {
    // Return error gracefully — admin panel shows error state
    res.json({
      isConfigured: true,
      report: null,
      error: err?.message || "GA4 API error",
    })
  }
}
