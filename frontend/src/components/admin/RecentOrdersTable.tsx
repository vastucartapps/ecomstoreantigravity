"use client"

import type { RecentOrder, OrderStatus } from "@/types/admin-dashboard"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary50: "#e8f5f3",
  primary100: "#c5e8e2",
  secondary500: "#c85103",
  secondary50: "#fff5ed",
  earth500: "#71685b",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

const allStatuses: OrderStatus[] = [
  "processing",
  "accepted",
  "shipped",
  "in_transit",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]

function getStatusStyle(status: OrderStatus) {
  const map: Record<OrderStatus, { bg: string; text: string; label: string }> = {
    processing: { bg: c.warningLight, text: c.warning, label: "Processing" },
    accepted: { bg: c.primary50, text: c.primary500, label: "Accepted" },
    shipped: { bg: c.primary100, text: c.primary500, label: "Shipped" },
    in_transit: { bg: c.primary100, text: c.primary400, label: "In Transit" },
    out_for_delivery: { bg: c.secondary50, text: c.secondary500, label: "Out for Delivery" },
    delivered: { bg: c.successLight, text: c.success, label: "Delivered" },
    cancelled: { bg: c.errorLight, text: c.error, label: "Cancelled" },
    returned: { bg: c.errorLight, text: c.error, label: "Returned" },
  }
  return map[status]
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

interface RecentOrdersTableProps {
  recentOrders: RecentOrder[]
  isLoading?: boolean
  onViewOrder?: (orderId: string) => void
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void
}

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: `1px solid rgba(117,97,90,0.1)` }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: i === 1 ? 120 : 80 }} />
        </td>
      ))}
    </tr>
  )
}

export function RecentOrdersTable({
  recentOrders,
  isLoading,
  onViewOrder,
  onUpdateOrderStatus,
}: RecentOrdersTableProps) {
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
      <div className="p-6">
        <h2
          className="mb-6 text-xl font-bold"
          style={{ fontFamily: fonts.heading, color: c.earth700 }}
        >
          Recent Orders
        </h2>

        {!isLoading && recentOrders.length === 0 ? (
          <div
            className="py-12 text-center"
            style={{ color: c.earth500, fontFamily: fonts.body }}
          >
            No orders to display
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 780 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid rgba(117,97,90,0.2)` }}>
                  {["Order #", "Customer", "Items", "Total", "Status", "Date", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ fontFamily: fonts.body, color: c.earth500 }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : recentOrders.map((order) => {
                      const statusStyle = getStatusStyle(order.status)
                      return (
                        <tr
                          key={order.id}
                          className="transition-colors"
                          style={{ borderBottom: `1px solid rgba(117,97,90,0.06)` }}
                        >
                          {/* Order # */}
                          <td className="py-4 pr-4">
                            <button
                              onClick={() => onViewOrder?.(order.id)}
                              className="text-sm font-semibold hover:underline"
                              style={{ fontFamily: fonts.mono, color: c.primary500 }}
                            >
                              {order.orderNumber}
                            </button>
                          </td>

                          {/* Customer */}
                          <td className="py-4 pr-4">
                            <div>
                              <div
                                className="text-sm font-medium"
                                style={{ fontFamily: fonts.body, color: c.earth700 }}
                              >
                                {order.customerName}
                              </div>
                              <div
                                className="text-xs"
                                style={{ fontFamily: fonts.body, color: c.earth500 }}
                              >
                                {order.customerEmail}
                              </div>
                            </div>
                          </td>

                          {/* Items */}
                          <td className="py-4 pr-4">
                            <span
                              className="text-sm"
                              style={{ fontFamily: fonts.body, color: c.earth700 }}
                            >
                              {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-4 pr-4">
                            <span
                              className="text-sm font-semibold"
                              style={{ fontFamily: fonts.mono, color: c.earth700 }}
                            >
                              {order.currency === "USD" ? "$" : "₹"}
                              {order.total.toLocaleString("en-IN")}
                            </span>
                          </td>

                          {/* Status dropdown */}
                          <td className="py-4 pr-4">
                            <ThemeSelect
                              value={order.status}
                              onChange={(v) => onUpdateOrderStatus?.(order.id, v as OrderStatus)}
                              options={allStatuses.map((s) => {
                                const st = getStatusStyle(s)
                                return { value: s, label: st.label }
                              })}
                              size="sm"
                            />
                          </td>

                          {/* Date */}
                          <td className="py-4 pr-4">
                            <span
                              className="text-sm"
                              style={{ fontFamily: fonts.body, color: c.earth500 }}
                            >
                              {formatRelativeTime(order.date)}
                            </span>
                          </td>

                          {/* View */}
                          <td className="py-4">
                            <button
                              onClick={() => onViewOrder?.(order.id)}
                              className="text-sm font-medium hover:underline"
                              style={{ fontFamily: fonts.body, color: c.primary500 }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
