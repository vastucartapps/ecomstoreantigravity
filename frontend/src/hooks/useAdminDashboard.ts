"use client"

import { useState, useEffect, useCallback } from "react"
import { medusa } from "@/lib/medusa"
import type {
  TimePeriod,
  DashboardStat,
  RevenueBar,
  RecentOrder,
  QuickAction,
  Alert,
  OrderStatus,
} from "@/types/admin-dashboard"

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

function getDateRanges(period: TimePeriod) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === "today") {
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    return {
      start: today,
      end: now,
      prevStart: yesterday,
      prevEnd: today,
    }
  }

  if (period === "week") {
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    return {
      start: weekAgo,
      end: now,
      prevStart: twoWeeksAgo,
      prevEnd: weekAgo,
    }
  }

  // month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return {
    start: startOfMonth,
    end: now,
    prevStart: startOfPrevMonth,
    prevEnd: startOfMonth,
  }
}

function toISO(d: Date) {
  return d.toISOString()
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function formatDayKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function dayLabel(d: Date, period: TimePeriod) {
  if (period === "today") return "Today"
  if (period === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    return days[d.getDay()]
  }
  return String(d.getDate())
}

// ---------------------------------------------------------------------------
// Medusa admin fetch helpers
// ---------------------------------------------------------------------------

async function fetchOrders(startISO: string, endISO: string) {
  try {
    const res = await medusa.client.fetch<{ orders: any[]; count: number }>(
      `/admin/orders?limit=500&created_at[$gte]=${encodeURIComponent(startISO)}&created_at[$lte]=${encodeURIComponent(endISO)}&fields=id,display_id,status,payment_status,total,currency_code,email,created_at,*customer,items.id,metadata`
    )
    return res.orders || []
  } catch {
    return []
  }
}

async function fetchCustomers(startISO: string, endISO: string) {
  try {
    const res = await medusa.client.fetch<{ customers: any[]; count: number }>(
      `/admin/customers?limit=500&created_at[$gte]=${encodeURIComponent(startISO)}&created_at[$lte]=${encodeURIComponent(endISO)}&fields=id,created_at`
    )
    return res.customers || []
  } catch {
    return []
  }
}

async function fetchLowStockProducts() {
  try {
    const res = await medusa.client.fetch<{ products: any[] }>(
      `/admin/products?limit=500&fields=id,title,variants.inventory_quantity,variants.title,variants.id`
    )
    const products = res.products || []
    // Filter products that have any variant with inventory_quantity < 2
    return products.filter((p: any) =>
      (p.variants || []).some(
        (v: any) => typeof v.inventory_quantity === "number" && v.inventory_quantity < 2
      )
    )
  } catch {
    return []
  }
}

async function fetchPendingReturns() {
  try {
    const res = await medusa.client.fetch<{ returns: any[]; count: number }>(
      `/admin/returns?limit=50&status=requested`
    )
    return (res.returns || []).length
  } catch {
    return 0
  }
}

async function fetchPendingReviews() {
  try {
    const res = await medusa.client.fetch<{ product_reviews: any[]; count: number }>(
      `/admin/product-reviews?status=pending&limit=1`
    )
    return res.count || (res.product_reviews || []).length
  } catch {
    // Reviews plugin not installed — return 0 gracefully
    return 0
  }
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapOrderStatus(order: any): OrderStatus {
  // Check metadata override first (set by inline status updates)
  const meta = order.metadata?.display_status
  if (meta) return meta as OrderStatus

  const status = order.status
  const payStatus = order.payment_status

  if (status === "cancelled") return "cancelled"
  if (status === "completed") return "delivered"
  if (status === "returned") return "returned"
  if (payStatus === "awaiting" || status === "pending") return "processing"
  if (status === "requires_action") return "processing"
  return "processing"
}

function formatOrderNumber(order: any): string {
  const date = new Date(order.created_at)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const id = String(order.display_id || "0").padStart(4, "0")
  return `VC-${year}-${month}${day}-${id}`
}

function buildStats(
  currentOrders: any[],
  prevOrders: any[],
  currentCustomers: any[],
  prevCustomers: any[],
  lowStockProducts: any[],
  reviewCount: number
): DashboardStat[] {
  const totalOrders = currentOrders.length
  const prevTotalOrders = prevOrders.length

  const capturedStatuses = ["captured", "partially_captured"]
  const revenue = currentOrders
    .filter((o) => capturedStatuses.includes(o.payment_status))
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100
  const prevRevenue = prevOrders
    .filter((o) => capturedStatuses.includes(o.payment_status))
    .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100

  const pendingOrders = currentOrders.filter(
    (o) => o.status === "pending" || o.payment_status === "awaiting"
  ).length
  const prevPendingOrders = prevOrders.filter(
    (o) => o.status === "pending" || o.payment_status === "awaiting"
  ).length

  const newCustomers = currentCustomers.length
  const prevNewCustomers = prevCustomers.length

  const prevLowStockCount = 0 // No delta for low stock (it's a current snapshot)

  return [
    {
      id: "total-orders",
      label: "Total Orders",
      value: totalOrders,
      previousValue: prevTotalOrders,
      format: "number",
      icon: "shopping-bag",
      linkTo: "orders",
    },
    {
      id: "revenue",
      label: "Revenue",
      value: Math.round(revenue),
      previousValue: Math.round(prevRevenue),
      format: "currency",
      currency: "INR",
      icon: "indian-rupee",
      linkTo: "orders",
    },
    {
      id: "pending-orders",
      label: "Pending Orders",
      value: pendingOrders,
      previousValue: prevPendingOrders,
      format: "number",
      icon: "clock",
      linkTo: "orders",
    },
    {
      id: "low-stock",
      label: "Low Stock Items",
      value: lowStockProducts.length,
      previousValue: prevLowStockCount,
      format: "number",
      icon: "alert-triangle",
      linkTo: "products",
    },
    {
      id: "new-customers",
      label: "New Customers",
      value: newCustomers,
      previousValue: prevNewCustomers,
      format: "number",
      icon: "users",
      linkTo: "customers",
    },
    {
      id: "recent-reviews",
      label: "New Reviews",
      value: reviewCount,
      previousValue: 0,
      format: "number",
      icon: "star",
      linkTo: "reviews",
    },
  ]
}

function buildRevenueBars(
  orders: any[],
  period: TimePeriod,
  start: Date,
  end: Date
): RevenueBar[] {
  if (period === "today") {
    const total = orders
      .filter((o) => ["captured", "partially_captured"].includes(o.payment_status))
      .reduce((sum: number, o: any) => sum + (o.total || 0), 0) / 100
    return [
      {
        date: formatDayKey(start),
        label: "Today",
        amount: Math.round(total),
      },
    ]
  }

  // Build a map of date → amount
  const dayMap: Record<string, number> = {}

  // Pre-fill all days in range
  const cursor = new Date(startOfDay(start))
  while (cursor <= end) {
    dayMap[formatDayKey(cursor)] = 0
    cursor.setDate(cursor.getDate() + 1)
  }

  // Aggregate orders
  for (const order of orders) {
    if (!["captured", "partially_captured"].includes(order.payment_status)) continue
    const key = formatDayKey(new Date(order.created_at))
    if (key in dayMap) {
      dayMap[key] = (dayMap[key] || 0) + (order.total || 0) / 100
    }
  }

  return Object.entries(dayMap).map(([date, amount]) => ({
    date,
    label: dayLabel(new Date(date), period),
    amount: Math.round(amount),
  }))
}

function buildRecentOrders(orders: any[]): RecentOrder[] {
  return orders
    .slice(0, 10)
    .map((order: any) => ({
      id: order.id,
      orderNumber: formatOrderNumber(order),
      customerName:
        [order.customer?.first_name, order.customer?.last_name]
          .filter(Boolean)
          .join(" ") || order.customer?.email || order.email || "Unknown",
      customerEmail: order.customer?.email || order.email || "",
      total: Math.round((order.total || 0) / 100),
      currency: (order.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
      status: mapOrderStatus(order),
      itemCount: (order.items || []).length,
      date: order.created_at,
    }))
}

function buildAlerts(
  lowStockProducts: any[],
  reviewCount: number,
  returnCount: number
): Alert[] {
  const alerts: Alert[] = []

  for (const product of lowStockProducts.slice(0, 10)) {
    const variants = (product.variants || []).filter(
      (v: any) => typeof v.inventory_quantity === "number" && v.inventory_quantity < 2
    )
    for (const variant of variants) {
      const qty = variant.inventory_quantity as number
      alerts.push({
        id: `low-stock-${product.id}-${variant.id}`,
        type: "low_stock",
        title: product.title + (variants.length > 1 ? ` — ${variant.title}` : ""),
        message: qty === 0 ? "Out of stock" : `Only ${qty} left in stock`,
        severity: qty === 0 ? "critical" : "warning",
        linkTo: `/admin/products/${product.id}`,
        meta: { currentQty: qty, threshold: 2 },
      })
    }
  }

  if (reviewCount > 0) {
    alerts.push({
      id: "pending-reviews",
      type: "pending_review",
      title: `${reviewCount} review${reviewCount > 1 ? "s" : ""} awaiting moderation`,
      message: "Check the reviews section to moderate",
      severity: "info",
      linkTo: "/admin/reviews?status=pending",
      meta: { count: reviewCount },
    })
  }

  if (returnCount > 0) {
    alerts.push({
      id: "new-returns",
      type: "new_return",
      title: `${returnCount} new return request${returnCount > 1 ? "s" : ""}`,
      message: "Pending return requests need attention",
      severity: "warning",
      linkTo: "/admin/returns?status=pending",
      meta: { count: returnCount },
    })
  }

  return alerts
}

// ---------------------------------------------------------------------------
// Default quick actions (static)
// ---------------------------------------------------------------------------

const defaultQuickActions: QuickAction[] = [
  {
    id: "add-product",
    label: "Add Product",
    icon: "plus-circle",
    href: "/admin/products",
    color: "primary",
  },
  {
    id: "new-order",
    label: "New Order",
    icon: "shopping-cart",
    href: "/admin/orders",
    color: "secondary",
  },
  {
    id: "new-coupon",
    label: "New Coupon",
    icon: "ticket",
    href: "/admin/coupons",
    color: "primary",
  },
]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface AdminDashboardData {
  stats: DashboardStat[]
  revenueBars: RevenueBar[]
  recentOrders: RecentOrder[]
  quickActions: QuickAction[]
  alerts: Alert[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useAdminDashboard(timePeriod: TimePeriod): AdminDashboardData {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStat[]>([])
  const [revenueBars, setRevenueBars] = useState<RevenueBar[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { start, end, prevStart, prevEnd } = getDateRanges(timePeriod)

      const [
        currentOrders,
        prevOrders,
        currentCustomers,
        prevCustomers,
        lowStockProducts,
        reviewCount,
        returnCount,
      ] = await Promise.all([
        fetchOrders(toISO(start), toISO(end)),
        fetchOrders(toISO(prevStart), toISO(prevEnd)),
        fetchCustomers(toISO(start), toISO(end)),
        fetchCustomers(toISO(prevStart), toISO(prevEnd)),
        fetchLowStockProducts(),
        fetchPendingReviews(),
        fetchPendingReturns(),
      ])

      // Sort current orders by date desc (most recent first)
      const sortedOrders = [...currentOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setStats(
        buildStats(
          sortedOrders,
          prevOrders,
          currentCustomers,
          prevCustomers,
          lowStockProducts,
          reviewCount
        )
      )
      setRevenueBars(buildRevenueBars(sortedOrders, timePeriod, start, end))
      setRecentOrders(buildRecentOrders(sortedOrders))
      setAlerts(buildAlerts(lowStockProducts, reviewCount, returnCount))
    } catch (e: any) {
      setError(e?.message || "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [timePeriod])

  useEffect(() => {
    load()
  }, [load])

  return {
    stats,
    revenueBars,
    recentOrders,
    quickActions: defaultQuickActions,
    alerts,
    isLoading,
    error,
    refetch: load,
  }
}
