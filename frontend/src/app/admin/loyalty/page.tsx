"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminLoyalty } from "@/components/admin/loyalty"
import { useAdminLoyalty } from "@/hooks/useAdminLoyalty"
import { primary, earth, fonts } from "@/lib/theme"
import type {
  LoyaltyConfig,
  LoyaltyStats,
  PointsAdjustment,
  PointsConfig,
  LoyaltyTier,
  AdjustmentType,
} from "@/types/admin-loyalty"

const DEFAULT_STATS: LoyaltyStats = {
  totalPointsIssued: 0,
  totalPointsRedeemed: 0,
  totalPointsExpired: 0,
  activeMembers: 0,
}

export default function LoyaltyRewardsPage() {
  const hook = useAdminLoyalty()

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig | null>(null)
  const [stats, setStats] = useState<LoyaltyStats>(DEFAULT_STATS)
  const [recentAdjustments, setRecentAdjustments] = useState<PointsAdjustment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [cfg, statsData, adjustments] = await Promise.all([
        hook.fetchConfig(),
        hook.fetchStats(),
        hook.fetchRecentAdjustments(),
      ])
      setLoyaltyConfig(cfg)
      setStats(statsData)
      setRecentAdjustments(adjustments)
    } catch (e: any) {
      setError(e?.message || "Failed to load loyalty configuration")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleProgram = async (enabled: boolean) => {
    if (!loyaltyConfig) return
    try {
      const updated = await hook.toggleProgram(enabled, loyaltyConfig)
      setLoyaltyConfig(updated)
      showToast(enabled ? "Loyalty program enabled" : "Loyalty program disabled")
    } catch {
      showToast("Failed to toggle loyalty program")
    }
  }

  const handleSaveConfig = async (pointsConfig: PointsConfig) => {
    if (!loyaltyConfig) return
    try {
      const updated = await hook.savePointsConfig(pointsConfig, loyaltyConfig)
      setLoyaltyConfig(updated)
      showToast("Points configuration saved")
    } catch {
      showToast("Failed to save configuration")
    }
  }

  const handleSaveTier = async (tier: LoyaltyTier) => {
    if (!loyaltyConfig) return
    try {
      const updated = await hook.saveTier(tier, loyaltyConfig)
      setLoyaltyConfig(updated)
      showToast(`Tier "${tier.name}" saved`)
    } catch {
      showToast("Failed to save tier")
    }
  }

  const handleSubmitAdjustment = async (data: {
    customerEmail: string
    type: AdjustmentType
    points: number
    reason: string
  }) => {
    await hook.submitAdjustment(data)
    // Refresh stats + adjustments
    const [statsData, adjustments] = await Promise.all([
      hook.fetchStats(),
      hook.fetchRecentAdjustments(),
    ])
    setStats(statsData)
    setRecentAdjustments(adjustments)
    showToast(`${data.type === "credit" ? "Credited" : "Debited"} ${data.points} points`)
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  if (error && !loyaltyConfig) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: earth[400], fontFamily: fonts.body }}>{error}</p>
        <button
          onClick={loadAll}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            backgroundColor: primary[500],
            color: "#fff",
            borderRadius: "0.5rem",
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <AdminLoyalty
        programEnabled={loyaltyConfig?.programEnabled ?? false}
        config={
          loyaltyConfig?.config ?? {
            pointsPerRupee: 1,
            pointsPerDollar: 10,
            minRedemptionPoints: 100,
            pointsExpiryDays: 30,
            pointsValueINR: 0.25,
            pointsValueUSD: 0.01,
          }
        }
        tiers={loyaltyConfig?.tiers ?? []}
        recentAdjustments={recentAdjustments}
        stats={stats}
        isLoading={isLoading}
        onToggleProgram={handleToggleProgram}
        onSaveConfig={handleSaveConfig}
        onSaveTier={handleSaveTier}
        onSubmitAdjustment={handleSubmitAdjustment}
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            backgroundColor: primary[500],
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: "0.5rem",
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)",
            zIndex: 9999,
            maxWidth: "320px",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
