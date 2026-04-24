export type PaymentStage = "initiated" | "succeeded" | "failed" | "dismissed"

export interface PaymentEventRow {
  id: string
  cart_id: string
  order_id: string | null
  stage: PaymentStage
  provider: string
  currency: string
  amount: number // minor units
  error_code: string | null
  error_message: string | null
  user_agent: string | null
  ip_address: string | null
  email: string | null
  created_at: string
}

export interface PaymentFunnelStats {
  initiated: number
  succeeded: number
  failed: number
  dismissed: number
  conversion_rate: number
  by_provider: Record<string, { initiated: number; succeeded: number; failed: number; dismissed: number }>
  by_error_code: Array<{ error_code: string; count: number }>
}

export interface PaymentEventsResponse {
  window: string
  since: string
  stats: PaymentFunnelStats
  events: PaymentEventRow[]
  count: number
}

export type WindowChoice = "24h" | "7d" | "30d"
