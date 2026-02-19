"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, Clock, Truck, CheckCircle2, XCircle, ChevronRight, Search, RefreshCw } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { Order, OrderStatus } from "@/types/dashboard"

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: "Pending", color: "#F59E0B", bgColor: "#FFFBEB", icon: Clock },
  processing: { label: "Processing", color: "#3B82F6", bgColor: "#EFF6FF", icon: RefreshCw },
  confirmed: { label: "Confirmed", color: "#8B5CF6", bgColor: "#F5F3FF", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "#F59E0B", bgColor: "#FFFBEB", icon: Truck },
  delivered: { label: "Delivered", color: "#10B981", bgColor: "#ECFDF5", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#EF4444", bgColor: "#FEF2F2", icon: XCircle },
  refunded: { label: "Refunded", color: "#6B7280", bgColor: "#F3F4F6", icon: RefreshCw },
}

const FILTER_TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
]

export function OrdersList() {
  const { fetchOrders } = useDashboardData()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchOrders(50).then((o) => {
      setOrders(o)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const filtered = orders.filter((o) => {
    const matchesFilter = activeFilter === "all" || o.status === activeFilter
    const matchesSearch = !search || o.orderNumber.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
            My Orders
          </h1>
          <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
            {orders.length} order{orders.length !== 1 ? "s" : ""} placed
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order number..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ border: "1.5px solid #e8e0d8", color: earth[700], fontFamily: fonts.body, background: bg.card }}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: activeFilter === tab.value ? primary[500] : bg.card,
              color: activeFilter === tab.value ? "#ffffff" : earth[600],
              border: `1px solid ${activeFilter === tab.value ? primary[500] : "#e8e0d8"}`,
              fontFamily: fonts.body,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        {isLoading ? (
          <div className="py-12 text-center" style={{ background: bg.card }}>
            <div className="animate-spin w-6 h-6 rounded-full border-2 border-transparent mx-auto" style={{ borderTopColor: primary[500] }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center" style={{ background: bg.card }}>
            <Package className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
            <p className="text-sm font-medium" style={{ color: earth[500] }}>No orders found</p>
            <p className="text-xs mt-1" style={{ color: earth[300] }}>
              {search ? "Try a different search term" : "Place your first order to see it here"}
            </p>
          </div>
        ) : (
          <div style={{ background: bg.card }}>
            {filtered.map((order, idx) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing
              const StatusIcon = status.icon
              const isLast = idx === filtered.length - 1
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    textDecoration: "none",
                    borderBottom: isLast ? "none" : "1px solid #f0ebe4",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#faf7f4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Left: thumbnail + info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {order.items[0]?.thumbnail ? (
                      <img
                        src={order.items[0].thumbnail}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        style={{ border: "1px solid #f0ebe4" }}
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: status.bgColor }}
                      >
                        <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: earth[700], fontFamily: fonts.body }}>
                        {order.orderNumber}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: earth[400] }}>
                        {order.orderDate}
                        {order.itemCount > 1 && ` · ${order.itemCount} items`}
                        {order.items[0] && order.itemCount === 1 && ` · ${order.items[0].productTitle}`}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium mt-1 px-2 py-0.5 rounded-full"
                        style={{ background: status.bgColor, color: status.color }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Right: amount + chevron */}
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-right" style={{ color: primary[500] }}>
                      ₹{order.total.toLocaleString("en-IN")}
                    </p>
                    <ChevronRight className="w-4 h-4" style={{ color: earth[300] }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
