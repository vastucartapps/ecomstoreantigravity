"use client"

import {
  ShoppingBag,
  IndianRupee,
  Clock,
  AlertTriangle,
  Users,
  Star,
  PlusCircle,
  ShoppingCart,
  Ticket,
} from "lucide-react"
import type { DashboardStat, IconName } from "@/types/admin-dashboard"

const c = {
  primary500: "#013f47",
  primary50: "#e8f5f3",
  earth500: "#71685b",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

const iconMap: Record<IconName, React.ElementType> = {
  "shopping-bag": ShoppingBag,
  "indian-rupee": IndianRupee,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  users: Users,
  star: Star,
  "plus-circle": PlusCircle,
  "shopping-cart": ShoppingCart,
  ticket: Ticket,
}

function formatValue(
  value: number,
  format: "number" | "currency",
  currency?: string
): string {
  if (format === "currency") {
    const symbol = currency === "USD" ? "$" : "₹"
    return `${symbol}${value.toLocaleString("en-IN")}`
  }
  return value.toLocaleString("en-IN")
}

type DeltaResult =
  | { kind: "none" }                                        // both 0 — no data
  | { kind: "new"; value: number }                          // previous=0, current>0
  | { kind: "percent"; percent: number; isPositive: boolean }

function calculateDelta(current: number, previous: number): DeltaResult {
  if (previous === 0 && current === 0) return { kind: "none" }
  if (previous === 0) return { kind: "new", value: current }
  const percent = ((current - previous) / previous) * 100
  return { kind: "percent", percent: Math.abs(percent), isPositive: percent >= 0 }
}

interface StatCardsProps {
  stats: DashboardStat[]
  isLoading?: boolean
  onStatClick?: (linkTo: string) => void
}

function SkeletonCard() {
  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: c.shadow,
        borderTop: "3px solid transparent",
        borderImage: c.gradient,
        borderImageSlice: 1,
      }}
    >
      <div className="p-5 sm:p-6 animate-pulse">
        <div className="mb-4 flex items-start justify-between">
          <div className="h-10 w-10 rounded-lg bg-gray-100" />
          <div className="h-6 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="h-4 w-24 rounded bg-gray-100 mb-2" />
        <div className="h-8 w-32 rounded bg-gray-100" />
      </div>
    </div>
  )
}

export function StatCards({ stats, isLoading, onStatClick }: StatCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
      {stats.map((stat) => {
        const delta = calculateDelta(stat.value, stat.previousValue)
        const IconComponent = iconMap[stat.icon] || ShoppingBag

        return (
          <button
            key={stat.id}
            onClick={() => onStatClick?.(stat.linkTo)}
            className="group rounded-lg text-left transition-all duration-200"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: c.shadow,
              borderTop: "3px solid transparent",
              borderImage: c.gradient,
              borderImageSlice: 1,
            }}
          >
            <div
              className="p-5 sm:p-6"
              onMouseEnter={(e) => {
                e.currentTarget.parentElement!.style.boxShadow = c.shadowHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.parentElement!.style.boxShadow = c.shadow
              }}
            >
              {/* Icon and Delta */}
              <div className="mb-4 flex items-start justify-between">
                <div
                  className="rounded-lg p-2"
                  style={{ backgroundColor: c.primary50, color: c.primary500 }}
                >
                  <IconComponent size={24} strokeWidth={1.8} />
                </div>

                {delta.kind === "none" && (
                  <div
                    className="rounded-full px-2 py-1 text-xs font-semibold"
                    style={{ fontFamily: fonts.mono, backgroundColor: "#f5f0eb", color: "#a39585" }}
                  >
                    — no data
                  </div>
                )}
                {delta.kind === "new" && (
                  <div
                    className="rounded-full px-2 py-1 text-xs font-semibold"
                    style={{ fontFamily: fonts.mono, backgroundColor: c.successLight, color: c.success }}
                  >
                    ↑ New
                  </div>
                )}
                {delta.kind === "percent" && (
                  <div
                    className="rounded-full px-2 py-1 text-xs font-semibold"
                    style={{
                      fontFamily: fonts.mono,
                      backgroundColor: delta.isPositive ? c.successLight : c.errorLight,
                      color: delta.isPositive ? c.success : c.error,
                    }}
                  >
                    {delta.isPositive ? "↑" : "↓"} {delta.percent.toFixed(1)}%
                  </div>
                )}
              </div>

              {/* Label */}
              <div
                className="mb-1 text-sm font-medium"
                style={{ fontFamily: fonts.body, color: c.earth500 }}
              >
                {stat.label}
              </div>

              {/* Value */}
              <div
                className="text-2xl font-bold sm:text-3xl"
                style={{ fontFamily: fonts.heading, color: c.earth700 }}
              >
                {formatValue(stat.value, stat.format, stat.currency)}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
