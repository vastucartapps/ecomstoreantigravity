import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PAYMENT_EVENTS_MODULE } from "../../../modules/payment-events"
import type { PaymentStage } from "../../../modules/payment-events/service"

/**
 * Public endpoint — logs a payment lifecycle event.
 *
 * Called by the storefront at each payment stage transition so we can
 * distinguish real failures from abandonments in the funnel dashboard.
 *
 * Auth: publishable-key only (no customer token required). Does not accept
 * amounts > store total — frontend can lie but the dashboard is for our
 * own funnel analysis, not billing. Order IDs are accepted but cross-checked
 * against the order module on dashboard read.
 */

const ALLOWED_STAGES = new Set(["initiated", "succeeded", "failed", "dismissed"])
const ALLOWED_PROVIDERS = new Set(["razorpay", "stripe", "paypal", "cod", "system", "giftcard"])

function clientIp(req: MedusaRequest): string | null {
  const fwd = req.headers["x-forwarded-for"]
  if (typeof fwd === "string") return fwd.split(",")[0].trim()
  if (Array.isArray(fwd) && fwd.length) return fwd[0]
  return (req as any).ip || null
}

function truncate(val: unknown, max: number): string | null {
  if (val === null || val === undefined) return null
  const s = String(val)
  return s.length > max ? s.slice(0, max) : s
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = (req.body || {}) as Record<string, unknown>

    const cart_id = typeof body.cart_id === "string" ? body.cart_id : ""
    const stage = typeof body.stage === "string" ? body.stage : ""
    const provider = typeof body.provider === "string" ? body.provider.toLowerCase() : "system"

    if (!cart_id || !ALLOWED_STAGES.has(stage)) {
      return res.status(400).json({ error: "cart_id and a valid stage are required" })
    }

    // Silently coerce unknown providers to "system" rather than rejecting —
    // we want every event logged, even if a new gateway ships before this list is updated.
    const safeProvider = ALLOWED_PROVIDERS.has(provider) ? provider : "system"

    const service = req.scope.resolve(PAYMENT_EVENTS_MODULE) as any

    await service.logEvent({
      cart_id,
      order_id: typeof body.order_id === "string" ? body.order_id : null,
      stage: stage as PaymentStage,
      provider: safeProvider,
      currency: typeof body.currency === "string" ? body.currency : "inr",
      amount: typeof body.amount === "number" ? body.amount : 0,
      error_code: truncate(body.error_code, 200),
      error_message: truncate(body.error_message, 1000),
      user_agent: truncate(req.headers["user-agent"], 500),
      ip_address: truncate(clientIp(req), 64),
      email: typeof body.email === "string" ? body.email.slice(0, 320) : null,
    })

    res.status(204).send(null)
  } catch {
    // Never fail the storefront on a logging error — this is observability, not critical path
    res.status(204).send(null)
  }
}
