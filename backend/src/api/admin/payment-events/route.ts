import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PAYMENT_EVENTS_MODULE } from "../../../modules/payment-events"
import type { PaymentStage } from "../../../modules/payment-events/service"

/**
 * Admin — returns funnel stats + recent events.
 *
 * Query params:
 *   - window   : "24h" | "7d" | "30d" (default: "7d")
 *   - stage    : filter recent events by stage
 *   - provider : filter recent events by provider
 *   - limit    : recent event limit (default 50, max 500)
 */

function windowToIso(window: string): string {
  const now = Date.now()
  const ms = window === "24h" ? 24 * 60 * 60 * 1000
    : window === "30d" ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000
  return new Date(now - ms).toISOString()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(PAYMENT_EVENTS_MODULE) as any

    const { window = "7d", stage, provider, limit = "50", offset = "0" } =
      (req.query as Record<string, string>) || {}

    const since = windowToIso(window)
    const stats = await service.getFunnelStats(since)

    const list = await service.listEvents({
      stage: (stage as PaymentStage) || undefined,
      provider: provider || undefined,
      limit: Math.min(parseInt(limit) || 50, 500),
      offset: Math.max(0, parseInt(offset) || 0),
    })

    res.json({
      window,
      since,
      stats,
      events: list.events,
      count: list.count,
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to load payment events" })
  }
}
