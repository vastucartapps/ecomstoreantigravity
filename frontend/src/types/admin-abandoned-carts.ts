export interface AbandonedCartAttempt {
  id: string
  cart_id: string
  email: string
  stage: number // 1 | 2 | 3
  sent_at: string
  recovery_token: string
  discount_code: string | null
  discount_expires_at: string | null
  recovered_at: string | null
  recovered_order_id: string | null
  recovered_amount: number
  created_at: string
}

export interface AbandonedCartStats {
  total_sent: number
  by_stage: { 1: number; 2: number; 3: number }
  recovered: number
  recovery_rate: number
  recovered_revenue_minor: number
}

export interface AbandonedCartsResponse {
  window: string
  since: string
  stats: AbandonedCartStats
  attempts: AbandonedCartAttempt[]
  count: number
}

export type WindowChoice = "24h" | "7d" | "30d"
export type StageFilter = "all" | "1" | "2" | "3"
export type RecoveredFilter = "all" | "true" | "false"
