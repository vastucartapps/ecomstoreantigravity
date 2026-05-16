import { MedusaService } from "@medusajs/framework/utils"
import AbandonedCartRecovery from "./models/abandoned-cart-recovery"
import { randomBytes } from "crypto"

export type RecoveryStage = 1 | 2 | 3

export interface RecoveryRecord {
  id: string
  cart_id: string
  email: string
  stage: number
  sent_at: string
  recovery_token: string
  discount_code: string | null
  discount_expires_at: string | null
  recovered_at: string | null
  recovered_order_id: string | null
  recovered_amount: number
  created_at: string
  updated_at: string
}

export interface RecoveryStats {
  total_sent: number
  by_stage: { 1: number; 2: number; 3: number }
  recovered: number
  recovery_rate: number
  recovered_revenue_minor: number
}

function newToken(): string {
  return randomBytes(24).toString("base64url")
}

class AbandonedCartRecoveryModuleService extends MedusaService({ AbandonedCartRecovery }) {
  /**
   * Record that a stage-N recovery email was sent for a cart. Returns the
   * created row, including the fresh recovery_token that should be embedded
   * in the email's recovery URL.
   */
  async logAttempt(data: {
    cart_id: string
    email: string
    stage: RecoveryStage
    discount_code?: string | null
    discount_expires_at?: Date | null
  }): Promise<RecoveryRecord> {
    const [created] = await (this as any).createAbandonedCartRecoveries([{
      cart_id: data.cart_id,
      email: data.email,
      stage: data.stage,
      sent_at: new Date(),
      recovery_token: newToken(),
      discount_code: data.discount_code ?? null,
      discount_expires_at: data.discount_expires_at ?? null,
      recovered_at: null,
      recovered_order_id: null,
      recovered_amount: 0,
    }])
    return created as RecoveryRecord
  }

  /**
   * Find the most recent recovery attempt for a cart (if any). Used by the
   * scheduled job to decide the next stage to send.
   */
  async latestForCart(cart_id: string): Promise<RecoveryRecord | null> {
    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(
      { cart_id },
      { order: { sent_at: "DESC" }, take: 1 }
    )
    return (rows && rows[0]) || null
  }

  async findByToken(token: string): Promise<RecoveryRecord | null> {
    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(
      { recovery_token: token },
      { take: 1 }
    )
    return (rows && rows[0]) || null
  }

  /**
   * One-click opt-out from the drip. Marks every row for the recipient's
   * email (matched off the row that owns the token) so unsubscribing from
   * one stage of one cart shuts off ALL subsequent stages for that address,
   * including future carts.
   */
  async optOutByToken(token: string): Promise<{ ok: boolean; email?: string }> {
    const target = await this.findByToken(token)
    if (!target) return { ok: false }
    const now = new Date()
    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(
      { email: target.email },
      { take: 1000 }
    )
    for (const r of (rows || []) as RecoveryRecord[]) {
      await (this as any).updateAbandonedCartRecoveries({
        id: r.id,
        opted_out_at: now,
      })
    }
    return { ok: true, email: target.email }
  }

  /** Returns true if the email address has previously opted out of recovery. */
  async hasOptedOut(email: string): Promise<boolean> {
    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(
      { email, opted_out_at: { $ne: null } },
      { take: 1 }
    )
    return Boolean(rows?.length)
  }

  /**
   * Mark every unrecovered recovery row for this cart as recovered, pinning
   * the order id + captured amount. One cart may have 1..3 rows (one per
   * stage); all are flagged so the admin dashboard credits the conversion
   * to the most-recent stage while not double-counting across stages.
   */
  async markRecovered(cart_id: string, order_id: string, amount_minor: number): Promise<number> {
    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(
      { cart_id, recovered_at: null },
      { take: 10 }
    )
    if (!rows?.length) return 0
    const now = new Date()
    for (const r of rows as RecoveryRecord[]) {
      await (this as any).updateAbandonedCartRecoveries({
        id: r.id,
        recovered_at: now,
        recovered_order_id: order_id,
        recovered_amount: amount_minor,
      })
    }
    return rows.length
  }

  async listAttempts(
    filters: { stage?: RecoveryStage; recovered?: boolean; limit?: number; offset?: number } = {}
  ): Promise<{ attempts: RecoveryRecord[]; count: number }> {
    const query: any = {}
    if (filters.stage) query.stage = filters.stage
    if (filters.recovered === true) query.recovered_at = { $ne: null }
    if (filters.recovered === false) query.recovered_at = null

    const [attempts, count] = await (this as any).listAndCountAbandonedCartRecoveries(query, {
      order: { sent_at: "DESC" },
      take: Math.min(filters.limit || 100, 500),
      skip: Math.max(0, filters.offset || 0),
    })
    return { attempts: attempts as RecoveryRecord[], count }
  }

  async getStats(sinceIso?: string): Promise<RecoveryStats> {
    const query: any = {}
    if (sinceIso) query.sent_at = { $gte: new Date(sinceIso) }

    const [rows] = await (this as any).listAndCountAbandonedCartRecoveries(query, { take: 10000 })

    const byStage = { 1: 0, 2: 0, 3: 0 }
    let recovered = 0
    let recoveredRevenue = 0

    // Count unique recovered carts (not rows — one cart may have 3 stage-rows all flagged recovered)
    const recoveredCartIds = new Set<string>()

    for (const r of rows as RecoveryRecord[]) {
      const s = r.stage as 1 | 2 | 3
      if (s >= 1 && s <= 3) byStage[s] = (byStage[s] || 0) + 1
      if (r.recovered_at && !recoveredCartIds.has(r.cart_id)) {
        recoveredCartIds.add(r.cart_id)
        recovered += 1
        recoveredRevenue += r.recovered_amount || 0
      }
    }

    const uniqueCartsSent = new Set((rows as RecoveryRecord[]).map((r) => r.cart_id)).size
    const recovery_rate = uniqueCartsSent > 0 ? recovered / uniqueCartsSent : 0

    return {
      total_sent: rows.length,
      by_stage: byStage,
      recovered,
      recovery_rate,
      recovered_revenue_minor: recoveredRevenue,
    }
  }
}

export default AbandonedCartRecoveryModuleService
