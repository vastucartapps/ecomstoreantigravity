"use client"

import { TrendingUp, Calendar, CheckCircle2, Clock, XCircle, IndianRupee, Users, BarChart3 } from "lucide-react"
import type { BookingStats } from "@/types/admin-booking"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  border: "#e8e0d8",
  earth700: "#3d2c1e",
  earth600: "#5c4433",
  earth400: "#9a7c68",
  earth300: "#b89b8a",
  earth100: "#f0ebe4",
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FFFBEB", color: "#F59E0B", label: "Pending" },
  confirmed: { bg: "#EFF6FF", color: "#3B82F6", label: "Confirmed" },
  completed: { bg: "#ECFDF5", color: "#10B981", label: "Completed" },
  cancelled: { bg: "#FEF2F2", color: "#EF4444", label: "Cancelled" },
}

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
  accent?: string
}

function StatTile({ icon, label, value, subtext, accent }: StatTileProps) {
  return (
    <div
      className="flex flex-col gap-1 p-4 rounded-2xl"
      style={{ background: c.card, border: `1px solid ${c.border}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.earth400 }}>{label}</span>
        <span style={{ color: accent || c.primary500 }}>{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: accent || c.primary500 }}>{value}</p>
      {subtext && <p className="text-xs" style={{ color: c.earth300 }}>{subtext}</p>}
    </div>
  )
}

interface Props {
  stats: BookingStats
  isLoading?: boolean
}

export function BookingStatsPanel({ stats, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="py-8 text-center" style={{ color: c.earth400 }}>
        <p className="text-sm">Loading stats…</p>
      </div>
    )
  }

  const completionRate = stats.total > 0
    ? Math.round(((stats.completed) / stats.total) * 100)
    : 0

  const maxCount = Math.max(...(stats.byServiceType.map((s) => s.count) || [1]), 1)

  return (
    <div className="space-y-5">
      {/* Top stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          icon={<Users className="w-4 h-4" />}
          label="Total Bookings"
          value={stats.total}
          subtext={`${stats.todayCount} today · ${stats.thisWeekCount} this week`}
        />
        <StatTile
          icon={<IndianRupee className="w-4 h-4" />}
          label="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`}
          subtext="From confirmed + completed"
          accent={c.secondary500}
        />
        <StatTile
          icon={<TrendingUp className="w-4 h-4" />}
          label="Completion Rate"
          value={`${completionRate}%`}
          subtext={`${stats.completed} of ${stats.total} completed`}
          accent="#10B981"
        />
        <StatTile
          icon={<Clock className="w-4 h-4" />}
          label="Pending Action"
          value={stats.pending}
          subtext={`${stats.confirmed} confirmed`}
          accent="#F59E0B"
        />
      </div>

      {/* Status breakdown */}
      <div
        className="rounded-2xl p-4"
        style={{ background: c.card, border: `1px solid ${c.border}` }}
      >
        <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: c.earth400 }}>
          Status Breakdown
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["pending", "confirmed", "completed", "cancelled"] as const).map((status) => {
            const sc = STATUS_COLORS[status]
            const count = stats[status]
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div
                key={status}
                className="flex flex-col items-center gap-1 p-3 rounded-xl"
                style={{ background: sc.bg }}
              >
                <span className="text-xl font-bold" style={{ color: sc.color }}>{count}</span>
                <span className="text-xs font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                <div className="w-full rounded-full h-1.5 mt-1" style={{ background: `${sc.color}30` }}>
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${pct}%`, background: sc.color }}
                  />
                </div>
                <span className="text-xs" style={{ color: sc.color }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* By service type matrix */}
      {stats.byServiceType.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: c.card, border: `1px solid ${c.border}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4" style={{ color: c.primary400 }} />
            <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: c.earth400 }}>
              Bookings by Service Type
            </h4>
          </div>
          <div className="space-y-3">
            {stats.byServiceType.map((item) => {
              const widthPct = Math.round((item.count / maxCount) * 100)
              return (
                <div key={item.title}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate flex-1 mr-2" style={{ color: c.earth600 }}>
                      {item.title}
                    </span>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-bold" style={{ color: c.primary500 }}>{item.count} bookings</span>
                      {item.revenue > 0 && (
                        <span className="text-xs font-semibold" style={{ color: c.secondary500 }}>
                          ₹{item.revenue.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full rounded-full h-2" style={{ background: c.earth100 }}>
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${widthPct}%`, background: c.primary500 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {stats.total === 0 && (
        <div
          className="py-8 text-center rounded-2xl"
          style={{ background: c.earth100, border: `1.5px dashed ${c.border}` }}
        >
          <Calendar className="w-10 h-10 mx-auto mb-2" style={{ color: c.earth300 }} />
          <p className="text-sm font-medium" style={{ color: c.earth600 }}>No bookings yet</p>
          <p className="text-xs mt-1" style={{ color: c.earth400 }}>
            Stats will appear once customers start booking consultations
          </p>
        </div>
      )}
    </div>
  )
}
