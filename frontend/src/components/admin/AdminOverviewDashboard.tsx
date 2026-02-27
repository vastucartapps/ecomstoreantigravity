"use client"

import { useState } from "react"
import type { AdminOverviewDashboardProps, TimePeriod } from "@/types/admin-dashboard"
import { StatCards } from "./StatCards"
import { RevenueChart } from "./RevenueChart"
import { RecentOrdersTable } from "./RecentOrdersTable"
import { QuickActions } from "./QuickActions"
import { AlertsSidebar } from "./AlertsSidebar"
import { MarketingHealthPanel } from "./MarketingHealthPanel"

const c = {
  earth700: "#433b35",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
}

const primary500 = "#013f47"
const cardBg = "#ffffff"

export function AdminOverviewDashboard({
  stats,
  revenueBars,
  recentOrders,
  quickActions,
  alerts,
  timePeriod: initialTimePeriod = "today",
  isLoading = false,
  marketingHealth,
  onTimePeriodChange,
  onStatClick,
  onViewOrder,
  onUpdateOrderStatus,
  onQuickAction,
  onAlertClick,
  onDismissAlert,
}: AdminOverviewDashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(initialTimePeriod)

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period)
    onTimePeriodChange?.(period)
  }

  const periods: { value: TimePeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ]

  return (
    <div className="w-full" style={{ fontFamily: fonts.body }}>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1
          className="text-2xl font-semibold"
          style={{ fontFamily: fonts.heading, color: c.earth700 }}
        >
          Dashboard
        </h1>

        {/* Time period toggle */}
        <div
          className="inline-flex rounded-lg p-1"
          style={{ backgroundColor: cardBg, boxShadow: c.shadow }}
        >
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => handleTimePeriodChange(period.value)}
              className="rounded-md px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: fonts.body,
                backgroundColor:
                  timePeriod === period.value ? primary500 : "transparent",
                color:
                  timePeriod === period.value ? "#ffffff" : "#71685b",
              }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Marketing Channels — top, always visible */}
      {marketingHealth && (
        <div className="mb-6">
          <MarketingHealthPanel data={marketingHealth} />
        </div>
      )}

      {/* Stat Cards */}
      <StatCards stats={stats} isLoading={isLoading} onStatClick={onStatClick} />

      {/* Chart + Quick Actions */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <RevenueChart revenueBars={revenueBars} isLoading={isLoading} />
        <QuickActions quickActions={quickActions} onQuickAction={onQuickAction} />
      </div>

      {/* Orders table + Alerts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <RecentOrdersTable
          recentOrders={recentOrders}
          isLoading={isLoading}
          onViewOrder={onViewOrder}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
        <AlertsSidebar
          alerts={alerts}
          isLoading={isLoading}
          onAlertClick={onAlertClick}
          onDismissAlert={onDismissAlert}
        />
      </div>
    </div>
  )
}
