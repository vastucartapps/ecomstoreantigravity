"use client"

import { useState } from "react"
import {
  Save,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Edit2,
  UserPlus,
  UserMinus,
  X,
  Check,
  Search,
  Loader2,
} from "lucide-react"
import { primary, secondary, earth, bg, fonts, gradients, semantic } from "@/lib/theme"
import type {
  AdminLoyaltyProps,
  PointsConfig,
  LoyaltyTier,
  AdjustmentType,
} from "@/types/admin-loyalty"

const shadow = "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)"
const gradient = gradients.accentBorder

function Card({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        background: `linear-gradient(#ffffff, #ffffff) padding-box, ${gradient} border-box`,
        borderTop: "4px solid transparent",
        borderRadius: "12px",
        boxShadow: shadow,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function AdminLoyalty({
  programEnabled,
  config: initialConfig,
  tiers,
  recentAdjustments,
  stats,
  isLoading,
  onToggleProgram,
  onSaveConfig,
  onSaveTier,
  onSubmitAdjustment,
}: AdminLoyaltyProps) {
  const [config, setConfig] = useState(initialConfig)
  const [adjustmentEmail, setAdjustmentEmail] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("credit")
  const [adjustmentPoints, setAdjustmentPoints] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Tier editing
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null)
  const [isSavingTier, setIsSavingTier] = useState(false)

  const handleSubmitAdjustment = async () => {
    if (!adjustmentEmail || !adjustmentPoints || !adjustmentReason) return
    setIsSubmitting(true)
    setAdjustmentError(null)
    try {
      await onSubmitAdjustment({
        customerEmail: adjustmentEmail,
        type: adjustmentType,
        points: adjustmentPoints,
        reason: adjustmentReason,
      })
      setAdjustmentEmail("")
      setAdjustmentPoints(0)
      setAdjustmentReason("")
    } catch (err: any) {
      setAdjustmentError(err.message || "Failed to submit adjustment")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveConfig = async () => {
    setIsSavingConfig(true)
    try {
      await onSaveConfig(config)
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleSaveTier = async () => {
    if (!editingTier) return
    setIsSavingTier(true)
    try {
      await onSaveTier(editingTier)
      setEditingTier(null)
    } finally {
      setIsSavingTier(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
        <Loader2 size={32} style={{ color: primary[500], animation: "spin 1s linear infinite" }} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body, maxWidth: "1200px" }}>
      {/* Program Toggle */}
      <Card style={{ padding: "24px 32px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Award size={28} style={{ color: primary[500] }} />
            <div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: earth[700], margin: "0 0 4px 0" }}>
                Loyalty Program
              </h2>
              <p style={{ fontSize: "14px", color: earth[500], margin: 0 }}>
                Manage points, tiers, and manual adjustments
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              style={{
                background: programEnabled ? semantic.successLight : semantic.warningLight,
                color: programEnabled ? semantic.success : semantic.warning,
                padding: "6px 14px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {programEnabled ? "Enabled" : "Disabled"}
            </span>
            <label style={{ position: "relative", display: "inline-block", width: "60px", height: "32px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={programEnabled}
                onChange={(e) => onToggleProgram(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: programEnabled ? primary[500] : earth[300],
                  borderRadius: "32px",
                  transition: "all 200ms",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: "26px", width: "26px",
                    left: programEnabled ? "31px" : "3px",
                    bottom: "3px",
                    background: "#ffffff",
                    borderRadius: "50%",
                    transition: "all 200ms",
                  }}
                />
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {[
          { icon: <TrendingUp size={24} style={{ color: primary[500] }} />, label: "Total Issued", value: stats.totalPointsIssued },
          { icon: <Award size={24} style={{ color: semantic.success }} />, label: "Total Redeemed", value: stats.totalPointsRedeemed },
          { icon: <Calendar size={24} style={{ color: semantic.warning }} />, label: "Total Expired", value: stats.totalPointsExpired },
          { icon: <Users size={24} style={{ color: secondary[500] }} />, label: "Active Members", value: stats.activeMembers },
        ].map((stat) => (
          <Card key={stat.label} style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              {stat.icon}
              <span style={{ fontSize: "14px", fontWeight: 600, color: earth[500] }}>{stat.label}</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: earth[700] }}>
              {stat.value.toLocaleString()}
            </div>
          </Card>
        ))}
      </div>

      {/* Points Configuration */}
      <Card style={{ padding: "32px", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: fonts.heading, fontSize: "18px", fontWeight: 600, color: earth[700], margin: "0 0 24px 0" }}>
          Points Configuration
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "24px" }}>
          {[
            { label: "Points per ₹1", key: "pointsPerRupee" as const, step: "1" },
            { label: "Points per $1", key: "pointsPerDollar" as const, step: "1" },
            { label: "Min Redemption Points", key: "minRedemptionPoints" as const, step: "1" },
            { label: "Points Expiry (Days)", key: "pointsExpiryDays" as const, step: "1" },
            { label: "Point Value (₹)", key: "pointsValueINR" as const, step: "0.01" },
            { label: "Point Value ($)", key: "pointsValueUSD" as const, step: "0.01" },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "8px" }}>
                {field.label}
              </label>
              <input
                type="number"
                step={field.step}
                value={config[field.key]}
                onChange={(e) => setConfig({ ...config, [field.key]: Number(e.target.value) })}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: fonts.body,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSavingConfig}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: primary[500],
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isSavingConfig ? "wait" : "pointer",
            opacity: isSavingConfig ? 0.7 : 1,
            transition: "all 200ms",
          }}
          onMouseEnter={(e) => !isSavingConfig && (e.currentTarget.style.background = primary[400])}
          onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
        >
          {isSavingConfig ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
          Save Configuration
        </button>
      </Card>

      {/* Loyalty Tiers */}
      <Card style={{ padding: "32px", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: fonts.heading, fontSize: "18px", fontWeight: 600, color: earth[700], margin: "0 0 24px 0" }}>
          Loyalty Tiers
        </h3>

        <div style={{ display: "grid", gap: "16px" }}>
          {tiers.map((tier) => (
            <div
              key={tier.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px",
                background: bg.subtle,
                borderRadius: "8px",
                borderLeft: `6px solid ${tier.color}`,
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <h4 style={{ fontSize: "18px", fontWeight: 700, color: earth[700], margin: 0 }}>
                    {tier.name}
                  </h4>
                  <span style={{ fontSize: "14px", color: earth[500] }}>
                    {tier.minPoints}+ points &bull; {tier.multiplier}x multiplier
                  </span>
                </div>
                <ul style={{ fontSize: "14px", color: earth[600], margin: "8px 0 0 20px", padding: 0 }}>
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx}>{benefit}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setEditingTier({ ...tier })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  background: "#ffffff",
                  color: primary[500],
                  border: `1px solid ${primary[500]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Edit2 size={14} />
                Edit
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Tier Edit Modal */}
      {editingTier && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 100,
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setEditingTier(null)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "32px",
              width: "90%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              zIndex: 101,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: "18px", fontWeight: 600, color: earth[700], margin: 0 }}>
                Edit Tier: {editingTier.name}
              </h3>
              <button
                onClick={() => setEditingTier(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: earth[400], padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "6px" }}>
                  Tier Name
                </label>
                <input
                  type="text"
                  value={editingTier.name}
                  onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "6px" }}>
                    Min Points
                  </label>
                  <input
                    type="number"
                    value={editingTier.minPoints}
                    onChange={(e) => setEditingTier({ ...editingTier, minPoints: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "6px" }}>
                    Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingTier.multiplier}
                    onChange={(e) => setEditingTier({ ...editingTier, multiplier: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontFamily: fonts.body, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "6px" }}>
                  Tier Color
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    type="color"
                    value={editingTier.color}
                    onChange={(e) => setEditingTier({ ...editingTier, color: e.target.value })}
                    style={{ width: "48px", height: "36px", border: "none", cursor: "pointer", borderRadius: "6px" }}
                  />
                  <input
                    type="text"
                    value={editingTier.color}
                    onChange={(e) => setEditingTier({ ...editingTier, color: e.target.value })}
                    style={{ flex: 1, padding: "10px 12px", border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontFamily: fonts.mono, outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "6px" }}>
                  Benefits (one per line)
                </label>
                <textarea
                  value={editingTier.benefits.join("\n")}
                  onChange={(e) =>
                    setEditingTier({
                      ...editingTier,
                      benefits: e.target.value.split("\n").filter((b) => b.trim()),
                    })
                  }
                  rows={5}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontFamily: fonts.body, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setEditingTier(null)}
                style={{ padding: "10px 20px", background: "transparent", color: earth[600], border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTier}
                disabled={isSavingTier}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 20px", background: primary[500], color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                  cursor: isSavingTier ? "wait" : "pointer", opacity: isSavingTier ? 0.7 : 1,
                }}
              >
                {isSavingTier ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                Save Tier
              </button>
            </div>
          </div>
        </>
      )}

      {/* Manual Adjustment */}
      <Card style={{ padding: "32px", marginBottom: "24px" }}>
        <h3 style={{ fontFamily: fonts.heading, fontSize: "18px", fontWeight: 600, color: earth[700], margin: "0 0 24px 0" }}>
          Manual Points Adjustment
        </h3>

        <div style={{ display: "grid", gap: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "8px" }}>
              Customer Email
            </label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Search size={16} color={earth[400]} />
              </span>
              <input
                type="email"
                value={adjustmentEmail}
                onChange={(e) => {
                  setAdjustmentEmail(e.target.value)
                  setAdjustmentError(null)
                }}
                placeholder="customer@example.com"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  border: `1px solid ${adjustmentError ? semantic.error : earth[300]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: fonts.body,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = adjustmentError ? semantic.error : earth[300])}
              />
            </div>
            {adjustmentError && (
              <p style={{ fontSize: "13px", color: semantic.error, margin: "6px 0 0 0" }}>
                {adjustmentError}
              </p>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "12px" }}>
                Adjustment Type
              </label>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === "credit"}
                    onChange={() => setAdjustmentType("credit")}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: primary[500] }}
                  />
                  <UserPlus size={18} style={{ color: semantic.success }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Credit</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="adjustmentType"
                    checked={adjustmentType === "debit"}
                    onChange={() => setAdjustmentType("debit")}
                    style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: primary[500] }}
                  />
                  <UserMinus size={18} style={{ color: semantic.error }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Debit</span>
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "8px" }}>
                Points Amount
              </label>
              <input
                type="number"
                value={adjustmentPoints || ""}
                onChange={(e) => setAdjustmentPoints(Number(e.target.value))}
                placeholder="100"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: fonts.body,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: earth[700], marginBottom: "8px" }}>
              Reason
            </label>
            <textarea
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              placeholder="Reason for adjustment..."
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px 12px",
                border: `1px solid ${earth[300]}`,
                borderRadius: "8px",
                fontSize: "14px",
                fontFamily: fonts.body,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = primary[400])}
              onBlur={(e) => (e.target.style.borderColor = earth[300])}
            />
          </div>

          <button
            onClick={handleSubmitAdjustment}
            disabled={!adjustmentEmail || !adjustmentPoints || !adjustmentReason || isSubmitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: adjustmentEmail && adjustmentPoints && adjustmentReason && !isSubmitting ? primary[500] : earth[300],
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: adjustmentEmail && adjustmentPoints && adjustmentReason && !isSubmitting ? "pointer" : "not-allowed",
              transition: "all 200ms",
              width: "fit-content",
            }}
            onMouseEnter={(e) =>
              adjustmentEmail && adjustmentPoints && adjustmentReason && !isSubmitting && (e.currentTarget.style.background = primary[400])
            }
            onMouseLeave={(e) =>
              adjustmentEmail && adjustmentPoints && adjustmentReason && !isSubmitting && (e.currentTarget.style.background = primary[500])
            }
          >
            {isSubmitting ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            Submit Adjustment
          </button>
        </div>
      </Card>

      {/* Recent Adjustments */}
      <Card style={{ padding: "32px" }}>
        <h3 style={{ fontFamily: fonts.heading, fontSize: "18px", fontWeight: 600, color: earth[700], margin: "0 0 24px 0" }}>
          Recent Adjustments
        </h3>

        {recentAdjustments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Award size={40} style={{ color: earth[300], marginBottom: "12px" }} />
            <p style={{ fontSize: "14px", color: earth[400] }}>No manual adjustments made yet.</p>
          </div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: bg.subtle }}>
                  {["Customer", "Type", "Points", "Reason", "Date"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: earth[700],
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAdjustments.map((adj, idx) => (
                  <tr
                    key={adj.id}
                    style={{
                      borderTop: idx === 0 ? "none" : `1px solid ${bg.subtle}`,
                      background: "#ffffff",
                    }}
                  >
                    <td style={{ padding: "16px", fontSize: "14px", color: earth[700] }}>
                      <div style={{ fontWeight: 600 }}>{adj.customerName || "—"}</div>
                      {adj.customerEmail && (
                        <div style={{ fontSize: "13px", color: earth[500] }}>{adj.customerEmail}</div>
                      )}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: adj.type === "credit" ? semantic.successLight : semantic.errorLight,
                          color: adj.type === "credit" ? semantic.success : semantic.error,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {adj.type === "credit" ? <UserPlus size={12} /> : <UserMinus size={12} />}
                        {adj.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600, color: earth[700], fontFamily: fonts.mono }}>
                      {adj.type === "credit" ? "+" : "-"}
                      {adj.points.toLocaleString()}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: earth[600], maxWidth: "250px" }}>
                      {adj.reason}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: earth[600], whiteSpace: "nowrap" }}>
                      {new Date(adj.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
