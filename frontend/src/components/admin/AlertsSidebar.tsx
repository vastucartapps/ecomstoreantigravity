"use client"

import { X } from "lucide-react"
import type { Alert, AlertSeverity } from "@/types/admin-dashboard"

const c = {
  primary400: "#2a7a72",
  earth500: "#71685b",
  earth700: "#433b35",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  bg: "#fffbf5",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

function getSeverityColor(severity: AlertSeverity): string {
  const map: Record<AlertSeverity, string> = {
    critical: c.error,
    warning: c.warning,
    info: c.primary400,
  }
  return map[severity]
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    low_stock: "Low Stock",
    pending_review: "Pending Reviews",
    new_return: "New Returns",
  }
  return map[type] || type
}

function groupAlertsByType(alerts: Alert[]): Record<string, Alert[]> {
  return alerts.reduce(
    (acc, alert) => {
      if (!acc[alert.type]) acc[alert.type] = []
      acc[alert.type].push(alert)
      return acc
    },
    {} as Record<string, Alert[]>
  )
}

interface AlertsSidebarProps {
  alerts: Alert[]
  isLoading?: boolean
  onAlertClick?: (linkTo: string) => void
  onDismissAlert?: (alertId: string) => void
}

export function AlertsSidebar({
  alerts,
  isLoading,
  onAlertClick,
  onDismissAlert,
}: AlertsSidebarProps) {
  const groupedAlerts = groupAlertsByType(alerts)
  const totalAlerts = alerts.length

  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: c.shadow,
        borderTop: "3px solid transparent",
        borderImage: c.gradient,
        borderImageSlice: 1,
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: fonts.heading, color: c.earth700 }}
        >
          Needs Attention
        </h2>
        {!isLoading && totalAlerts > 0 && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-bold"
            style={{
              backgroundColor: c.error,
              color: "#ffffff",
              fontFamily: fonts.mono,
            }}
          >
            {totalAlerts}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg"
              style={{ backgroundColor: c.bg }}
            />
          ))}
        </div>
      ) : totalAlerts === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-2 text-4xl">✓</div>
          <p className="text-sm" style={{ fontFamily: fonts.body, color: c.earth500 }}>
            All clear! No alerts at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAlerts).map(([type, typeAlerts]) => (
            <div key={type}>
              <h3
                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: fonts.body, color: c.earth500 }}
              >
                {getTypeLabel(type)} ({typeAlerts.length})
              </h3>
              <div className="space-y-2">
                {typeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="group relative rounded-lg p-3 transition-all duration-200"
                    style={{
                      backgroundColor: c.bg,
                      borderLeft: `3px solid ${getSeverityColor(alert.severity)}`,
                    }}
                  >
                    {/* Dismiss */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDismissAlert?.(alert.id)
                      }}
                      className="absolute right-2 top-2 rounded p-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      style={{ color: c.earth500 }}
                      aria-label="Dismiss alert"
                    >
                      <X size={14} />
                    </button>

                    {/* Content */}
                    <button
                      onClick={() => onAlertClick?.(alert.linkTo)}
                      className="w-full pr-6 text-left"
                    >
                      <h4
                        className="mb-1 text-sm font-semibold"
                        style={{ fontFamily: fonts.body, color: c.earth700 }}
                      >
                        {alert.title}
                      </h4>
                      <p
                        className="text-xs leading-relaxed"
                        style={{ fontFamily: fonts.body, color: c.earth500 }}
                      >
                        {alert.message}
                      </p>

                      {alert.meta && Object.keys(alert.meta).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(alert.meta).map(([key, value]) => (
                            <span
                              key={key}
                              className="rounded px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: "rgba(117,97,90,0.12)",
                                color: c.earth700,
                                fontFamily: fonts.mono,
                              }}
                            >
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
