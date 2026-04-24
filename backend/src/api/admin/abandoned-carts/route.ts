import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ABANDONED_CART_RECOVERY_MODULE } from "../../../modules/abandoned-cart-recovery"

/**
 * Admin — abandoned cart recovery stats + recent attempts.
 *
 * Query params:
 *   - window    : "24h" | "7d" | "30d" (default "7d")
 *   - stage     : "1" | "2" | "3" (filter list)
 *   - recovered : "true" | "false" (filter list)
 *   - limit     : default 100, max 500
 *   - offset    : default 0
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
    const service = req.scope.resolve(ABANDONED_CART_RECOVERY_MODULE) as any

    const { window = "7d", stage, recovered, limit = "100", offset = "0" } =
      (req.query as Record<string, string>) || {}

    const since = windowToIso(window)
    const stats = await service.getStats(since)

    const stageNum = stage ? Number(stage) : undefined
    const recoveredBool =
      recovered === "true" ? true : recovered === "false" ? false : undefined

    const list = await service.listAttempts({
      stage: stageNum && stageNum >= 1 && stageNum <= 3 ? stageNum : undefined,
      recovered: recoveredBool,
      limit: Math.min(parseInt(limit) || 100, 500),
      offset: Math.max(0, parseInt(offset) || 0),
    })

    res.json({
      window,
      since,
      stats,
      attempts: list.attempts,
      count: list.count,
    })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to load abandoned carts" })
  }
}
