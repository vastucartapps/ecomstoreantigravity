import { MedusaService } from "@medusajs/framework/utils"
import PaymentEvent from "./models/payment-event"

export type PaymentStage = "initiated" | "succeeded" | "failed" | "dismissed"

export interface LogPaymentEventInput {
  cart_id: string
  order_id?: string | null
  stage: PaymentStage
  provider: string
  currency: string
  amount?: number
  error_code?: string | null
  error_message?: string | null
  user_agent?: string | null
  ip_address?: string | null
  email?: string | null
}

export interface PaymentEventFunnelStats {
  initiated: number
  succeeded: number
  failed: number
  dismissed: number
  conversion_rate: number
  by_provider: Record<string, { initiated: number; succeeded: number; failed: number; dismissed: number }>
  by_error_code: Array<{ error_code: string; count: number }>
}

class PaymentEventsModuleService extends MedusaService({ PaymentEvent }) {
  async logEvent(data: LogPaymentEventInput): Promise<any> {
    return (this as any).createPaymentEvents({
      cart_id: data.cart_id,
      order_id: data.order_id ?? null,
      stage: data.stage,
      provider: data.provider || "system",
      currency: (data.currency || "inr").toLowerCase(),
      amount: Math.max(0, Math.floor(data.amount ?? 0)),
      error_code: data.error_code ?? null,
      error_message: data.error_message ?? null,
      user_agent: data.user_agent ?? null,
      ip_address: data.ip_address ?? null,
      email: data.email ?? null,
    })
  }

  async listEvents(
    filters: { stage?: PaymentStage; provider?: string; limit?: number; offset?: number } = {}
  ): Promise<{ events: any[]; count: number }> {
    const query: any = {}
    if (filters.stage) query.stage = filters.stage
    if (filters.provider) query.provider = filters.provider

    const [events, count] = await (this as any).listAndCountPaymentEvents(query, {
      order: { created_at: "DESC" },
      take: Math.min(filters.limit || 100, 500),
      skip: Math.max(0, filters.offset || 0),
    })
    return { events, count }
  }

  /**
   * Aggregate funnel stats across a time window.
   * A single cart may produce multiple events of the same stage (e.g. retries);
   * we count events per row (not unique carts) to show true activity volume.
   * Conversion is succeeded / initiated — the funnel outcome rate.
   */
  async getFunnelStats(sinceIso?: string): Promise<PaymentEventFunnelStats> {
    const query: any = {}
    if (sinceIso) {
      query.created_at = { $gte: new Date(sinceIso) }
    }

    // Pull all events in window; in practice volumes are small (< 10k/month for VastuCart scale).
    const [events] = await (this as any).listAndCountPaymentEvents(query, { take: 10000 })

    const totals = { initiated: 0, succeeded: 0, failed: 0, dismissed: 0 }
    const byProvider: Record<string, { initiated: number; succeeded: number; failed: number; dismissed: number }> = {}
    const errorCounts: Record<string, number> = {}

    for (const e of events as any[]) {
      totals[e.stage as PaymentStage] = (totals[e.stage as PaymentStage] || 0) + 1
      const p = e.provider || "unknown"
      if (!byProvider[p]) byProvider[p] = { initiated: 0, succeeded: 0, failed: 0, dismissed: 0 }
      byProvider[p][e.stage as PaymentStage] = (byProvider[p][e.stage as PaymentStage] || 0) + 1
      if (e.stage === "failed" && e.error_code) {
        errorCounts[e.error_code] = (errorCounts[e.error_code] || 0) + 1
      }
    }

    const conversion_rate = totals.initiated > 0 ? totals.succeeded / totals.initiated : 0

    const by_error_code = Object.entries(errorCounts)
      .map(([error_code, count]) => ({ error_code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return { ...totals, conversion_rate, by_provider: byProvider, by_error_code }
  }
}

export default PaymentEventsModuleService
