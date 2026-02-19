import { MedusaService } from "@medusajs/framework/utils"
import LoyaltyTransaction from "./models/loyalty-transaction"

class LoyaltyModuleService extends MedusaService({ LoyaltyTransaction }) {
  async getBalance(customerId: string): Promise<number> {
    const [transactions] = await this.listAndCountLoyaltyTransactions(
      { customer_id: customerId },
      { order: { created_at: "DESC" }, take: 1 }
    )
    if (transactions.length === 0) return 0
    return transactions[0].balance_after
  }

  async getTransactions(customerId: string): Promise<any[]> {
    const [transactions] = await this.listAndCountLoyaltyTransactions(
      { customer_id: customerId },
      { order: { created_at: "DESC" }, take: 50 }
    )
    return transactions
  }

  async addPoints(
    customerId: string,
    points: number,
    description: string,
    type: "earned" | "redeemed" | "adjusted" = "earned",
    options?: { expires_at?: Date; order_id?: string }
  ): Promise<any> {
    const currentBalance = await this.getBalance(customerId)
    const newBalance = Math.max(0, currentBalance + points)
    return this.createLoyaltyTransactions({
      customer_id: customerId,
      points,
      type,
      description,
      balance_after: newBalance,
      expires_at: options?.expires_at || null,
      order_id: options?.order_id || null,
    })
  }

  async redeemPoints(
    customerId: string,
    points: number
  ): Promise<{ success: boolean; newBalance: number }> {
    const currentBalance = await this.getBalance(customerId)
    if (currentBalance < points) {
      return { success: false, newBalance: currentBalance }
    }
    const newBalance = currentBalance - points
    await this.createLoyaltyTransactions({
      customer_id: customerId,
      points: -points,
      type: "redeemed",
      description: `Redeemed ${points} loyalty points`,
      balance_after: newBalance,
    })
    return { success: true, newBalance }
  }

  async getStats(): Promise<{
    totalPointsIssued: number
    totalPointsRedeemed: number
    totalPointsExpired: number
    activeMembers: number
  }> {
    // Get all transactions
    const allTransactions = await this.listLoyaltyTransactions(
      {},
      { take: 100000 }
    )

    let totalIssued = 0
    let totalRedeemed = 0
    let totalExpired = 0
    const customerIds = new Set<string>()

    for (const tx of allTransactions) {
      customerIds.add(tx.customer_id)
      if (tx.type === "earned") {
        totalIssued += tx.points
      } else if (tx.type === "redeemed") {
        totalRedeemed += Math.abs(tx.points)
      } else if (tx.type === "expired") {
        totalExpired += Math.abs(tx.points)
      } else if (tx.type === "adjusted") {
        if (tx.points > 0) totalIssued += tx.points
        else totalRedeemed += Math.abs(tx.points)
      }
    }

    return {
      totalPointsIssued: totalIssued,
      totalPointsRedeemed: totalRedeemed,
      totalPointsExpired: totalExpired,
      activeMembers: customerIds.size,
    }
  }

  async getRecentAdjustments(limit: number = 10): Promise<any[]> {
    const [transactions] = await this.listAndCountLoyaltyTransactions(
      { type: "adjusted" },
      { order: { created_at: "DESC" }, take: limit }
    )
    return transactions
  }

  async expirePoints(): Promise<number> {
    const now = new Date()

    // Find earned transactions that have expired but not yet marked
    const expirable = await this.listLoyaltyTransactions(
      {
        type: "earned",
        is_expired: false,
      },
      { take: 10000 }
    )

    // Filter to those with expires_at in the past
    const toExpire = expirable.filter(
      (tx: any) => tx.expires_at && new Date(tx.expires_at) < now
    )

    let expiredCount = 0

    // Group by customer to batch balance updates
    const byCustomer = new Map<string, any[]>()
    for (const tx of toExpire) {
      const existing = byCustomer.get(tx.customer_id) || []
      existing.push(tx)
      byCustomer.set(tx.customer_id, existing)
    }

    for (const [customerId, txs] of byCustomer.entries()) {
      const totalExpiring = txs.reduce((sum: number, tx: any) => sum + tx.points, 0)
      if (totalExpiring <= 0) continue

      const currentBalance = await this.getBalance(customerId)
      // Only expire up to the current balance
      const actualExpiry = Math.min(totalExpiring, currentBalance)

      if (actualExpiry > 0) {
        const newBalance = currentBalance - actualExpiry
        await this.createLoyaltyTransactions({
          customer_id: customerId,
          points: -actualExpiry,
          type: "expired",
          description: `${actualExpiry} points expired (${txs.length} transaction${txs.length > 1 ? "s" : ""})`,
          balance_after: newBalance,
        })
      }

      // Mark all as expired
      for (const tx of txs) {
        await this.updateLoyaltyTransactions(tx.id, { is_expired: true })
        expiredCount++
      }
    }

    return expiredCount
  }
}

export default LoyaltyModuleService
