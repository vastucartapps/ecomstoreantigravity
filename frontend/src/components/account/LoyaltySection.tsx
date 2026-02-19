"use client"

import { useEffect, useState } from "react"
import { Star, TrendingUp, TrendingDown, Minus, Loader2, Gift, ShoppingBag } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts, gradients } from "@/lib/theme"
import type { LoyaltyBalance, LoyaltyTransaction } from "@/types/dashboard"

const TYPE_CONFIG = {
  earned: { label: "Earned", icon: TrendingUp, color: "#10B981", bg: "#ECFDF5", prefix: "+" },
  redeemed: { label: "Redeemed", icon: TrendingDown, color: "#EF4444", bg: "#FEF2F2", prefix: "-" },
  adjusted: { label: "Adjusted", icon: Minus, color: "#6B7280", bg: "#F3F4F6", prefix: "" },
}

export function LoyaltySection() {
  const { fetchLoyalty } = useDashboardData()
  const [data, setData] = useState<LoyaltyBalance>({ balance: 0, transactions: [] })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLoyalty().then((d) => {
      setData(d)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  // Calculate stats
  const totalEarned = data.transactions.filter((t) => t.type === "earned").reduce((s, t) => s + t.points, 0)
  const totalRedeemed = data.transactions.filter((t) => t.type === "redeemed").reduce((s, t) => s + Math.abs(t.points), 0)
  const cashValue = Math.floor(data.balance / 10) // 10 points = ₹1

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          Loyalty Points
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          Earn 1 point for every ₹100 spent
        </p>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm opacity-80">Current Balance</p>
            <p className="text-3xl font-bold" style={{ fontFamily: fonts.heading }}>
              {data.balance.toLocaleString("en-IN")}
              <span className="text-lg ml-1 opacity-80">pts</span>
            </p>
          </div>
        </div>
        <p className="text-sm opacity-80">
          ≈ ₹{cashValue.toLocaleString("en-IN")} cash value (10 pts = ₹1)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}>
          <TrendingUp className="w-5 h-5 mb-2" style={{ color: "#10B981" }} />
          <p className="text-xl font-bold" style={{ color: "#10B981" }}>{totalEarned.toLocaleString("en-IN")}</p>
          <p className="text-xs mt-0.5" style={{ color: "#065F46" }}>Total Earned</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <TrendingDown className="w-5 h-5 mb-2" style={{ color: "#EF4444" }} />
          <p className="text-xl font-bold" style={{ color: "#EF4444" }}>{totalRedeemed.toLocaleString("en-IN")}</p>
          <p className="text-xs mt-0.5" style={{ color: "#7F1D1D" }}>Total Redeemed</p>
        </div>
      </div>

      {/* How to earn */}
      <div className="rounded-2xl p-4" style={{ background: `${primary[50]}`, border: `1px solid ${primary[100]}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: primary[700] }}>How to Earn Points</h3>
        <div className="space-y-2">
          {[
            { icon: ShoppingBag, text: "Earn 1 point for every ₹100 spent on orders" },
            { icon: Gift, text: "Bonus points on special occasions and promotions" },
            { icon: Star, text: "Points are credited after order is confirmed" },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="flex items-start gap-2">
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: primary[500] }} />
                <p className="text-xs" style={{ color: earth[600] }}>{item.text}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid #f0ebe4", background: bg.card }}>
          <p className="text-sm font-semibold" style={{ color: earth[700] }}>Transaction History</p>
        </div>

        {data.transactions.length === 0 ? (
          <div className="py-10 text-center" style={{ background: bg.card }}>
            <Star className="w-10 h-10 mx-auto mb-2" style={{ color: earth[200] }} />
            <p className="text-sm" style={{ color: earth[400] }}>No transactions yet</p>
            <p className="text-xs mt-1" style={{ color: earth[300] }}>Place an order to earn your first points!</p>
          </div>
        ) : (
          <div style={{ background: bg.card }}>
            {data.transactions.map((txn: LoyaltyTransaction, idx) => {
              const config = TYPE_CONFIG[txn.type] || TYPE_CONFIG.adjusted
              const Icon = config.icon
              const isLast = idx === data.transactions.length - 1
              const absPoints = Math.abs(txn.points)
              return (
                <div
                  key={txn.id}
                  className="flex items-center gap-3 px-5 py-4"
                  style={{ borderBottom: isLast ? "none" : "1px solid #f0ebe4" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: earth[700] }}>{txn.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{formatDate(txn.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold" style={{ color: config.color }}>
                      {config.prefix}{absPoints} pts
                    </p>
                    <p className="text-xs" style={{ color: earth[400] }}>
                      Bal: {txn.balance_after}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
