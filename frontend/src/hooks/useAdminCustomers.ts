"use client"

import { useCallback } from "react"
import { medusa, adminFetch } from "@/lib/medusa"
import type {
  CustomerRow,
  CustomerDetail,
  CustomerFilters,
  CustomerSegment,
  CustomerOrder,
  CustomerAddress,
  AdminNote,
} from "@/types/admin-customer"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatOrderNumber(order: any): string {
  const date = new Date(order.created_at)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const id = String(order.display_id || "0").padStart(4, "0")
  return `VC-${year}-${month}${day}-${id}`
}

function mapOrderStatus(order: any): string {
  const meta = order.metadata?.display_status
  if (meta) return meta
  const status = order.status
  if (status === "cancelled") return "cancelled"
  if (status === "completed") return "delivered"
  if (status === "returned") return "returned"
  return "processing"
}

interface OrderStats {
  orderCount: number
  lifetimeValue: number
  lastOrderDate: number | null
  lastOrderAt: string | null
}

function computeSegments(
  customer: any,
  stats: OrderStats,
  isHighValue: boolean
): CustomerSegment[] {
  const segments: CustomerSegment[] = []
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000

  if (new Date(customer.created_at).getTime() > thirtyDaysAgo) {
    segments.push("new")
  }
  if (stats.orderCount >= 2) {
    segments.push("repeat")
  }
  if (!stats.lastOrderDate || stats.lastOrderDate < ninetyDaysAgo) {
    segments.push("inactive")
  }
  if (isHighValue) {
    segments.push("high_value")
  }
  return segments
}

function mapMedusaCustomerRow(
  c: any,
  stats: OrderStats,
  isHighValue: boolean
): CustomerRow {
  return {
    id: c.id,
    name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unknown",
    email: c.email || "",
    phone: c.phone || "",
    avatarUrl: c.metadata?.avatar_url || "",
    totalOrders: stats.orderCount,
    lifetimeValue: stats.lifetimeValue,
    currency: (c.metadata?.currency || "INR") as "INR" | "USD",
    segments: computeSegments(c, stats, isHighValue),
    joinedAt: c.created_at,
  }
}

function mapMedusaOrderToCustomerOrder(o: any): CustomerOrder {
  return {
    id: o.id,
    orderNumber: formatOrderNumber(o),
    total: Math.round((o.total || 0) / 100),
    currency: (o.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
    status: mapOrderStatus(o),
    date: o.created_at,
    itemCount: (o.items || []).length,
  }
}

function mapMedusaAddress(addr: any): CustomerAddress {
  const label = addr.metadata?.label || "Home"
  return {
    id: addr.id,
    label: ["Home", "Office", "Other"].includes(label) ? label : "Other",
    street: [addr.address_1, addr.address_2].filter(Boolean).join(", "),
    city: addr.city || "",
    state: addr.province || "",
    pincode: addr.postal_code || "",
    country: addr.country_code?.toUpperCase() || "",
    isDefault: !!addr.metadata?.is_default,
  }
}

async function getAdminAuthor(): Promise<string> {
  try {
    const res = await adminFetch<{ user: any }>("/admin/users/me")
    return (
      [res.user?.first_name, res.user?.last_name].filter(Boolean).join(" ") ||
      res.user?.email ||
      "Admin"
    )
  } catch {
    return "Admin"
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminCustomers() {
  const fetchCustomers = useCallback(
    async (
      search: string,
      page: number,
      perPage: number
    ): Promise<{ rows: CustomerRow[]; totalCount: number }> => {
      const offset = (page - 1) * perPage

      const params = new URLSearchParams()
      params.set("limit", String(perPage))
      params.set("offset", String(offset))
      params.set("fields", "id,first_name,last_name,email,phone,metadata,created_at")
      params.set("order[created_at]", "DESC")
      if (search) {
        params.set("q", search)
      }

      const [customerRes, ordersRes] = await Promise.all([
        adminFetch<{ customers: any[]; count: number }>(
          `/admin/customers?${params.toString()}`
        ),
        adminFetch<{ orders: any[]; count: number }>(
          `/admin/orders?fields=id,total,created_at,status,metadata,customer_id&limit=500&order[created_at]=DESC`
        ),
      ])

      const customers = customerRes.customers || []
      const allOrders = ordersRes.orders || []

      // Group orders by customer_id
      const ordersByCustomer = new Map<string, OrderStats>()
      for (const order of allOrders) {
        const cid = order.customer_id
        if (!cid) continue
        const existing = ordersByCustomer.get(cid) || {
          orderCount: 0,
          lifetimeValue: 0,
          lastOrderDate: null,
          lastOrderAt: null,
        }
        existing.orderCount++
        existing.lifetimeValue += Math.round((order.total || 0) / 100)
        const orderDate = new Date(order.created_at).getTime()
        if (!existing.lastOrderDate || orderDate > existing.lastOrderDate) {
          existing.lastOrderDate = orderDate
          existing.lastOrderAt = order.created_at
        }
        ordersByCustomer.set(cid, existing)
      }

      // Compute high_value threshold (top 10%)
      const allValues = customers
        .map((c: any) => ordersByCustomer.get(c.id)?.lifetimeValue || 0)
        .sort((a: number, b: number) => b - a)
      const top10Idx = Math.floor(allValues.length * 0.1)
      const highValueThreshold = allValues[top10Idx] || 1

      const rows: CustomerRow[] = customers.map((c: any) => {
        const stats = ordersByCustomer.get(c.id) || {
          orderCount: 0,
          lifetimeValue: 0,
          lastOrderDate: null,
          lastOrderAt: null,
        }
        const isHighValue = stats.lifetimeValue > 0 && stats.lifetimeValue >= highValueThreshold
        return mapMedusaCustomerRow(c, stats, isHighValue)
      })

      return { rows, totalCount: customerRes.count || rows.length }
    },
    []
  )

  const fetchCustomerDetail = useCallback(
    async (id: string): Promise<CustomerDetail | null> => {
      try {
        const [customerRes, ordersRes, loyaltyRes] = await Promise.all([
          adminFetch<{ customer: any }>(
            `/admin/customers/${id}?fields=id,first_name,last_name,email,phone,metadata,created_at,*addresses`
          ),
          adminFetch<{ orders: any[]; count: number }>(
            `/admin/orders?customer_id=${id}&fields=id,display_id,total,created_at,status,metadata,*items&order[created_at]=desc&limit=5`
          ),
          adminFetch<{ points: number }>(
            `/admin/customers/${id}/loyalty`
          ).catch(() => ({ points: 0 })),
        ])

        const c = customerRes.customer
        if (!c) return null

        const recentOrders: CustomerOrder[] = (ordersRes.orders || []).map(
          mapMedusaOrderToCustomerOrder
        )

        const addresses: CustomerAddress[] = (c.addresses || []).map(mapMedusaAddress)
        const notes: AdminNote[] = Array.isArray(c.metadata?.admin_notes)
          ? c.metadata.admin_notes
          : []

        const loyaltyPoints = loyaltyRes.points || 0
        const totalOrders = ordersRes.count || recentOrders.length

        // Compute stats from recent orders (approximation; full stats only from list)
        const lifetimeValue = recentOrders.reduce((sum, o) => sum + o.total, 0)
        const avgOrderValue = totalOrders > 0 ? Math.round(lifetimeValue / recentOrders.length) : 0
        const lastOrderAt = recentOrders[0]?.date || null

        // Segment computation from available data
        const now = Date.now()
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
        const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
        const segments: CustomerSegment[] = []
        if (new Date(c.created_at).getTime() > thirtyDaysAgo) segments.push("new")
        if (totalOrders >= 2) segments.push("repeat")
        if (!lastOrderAt || new Date(lastOrderAt).getTime() < ninetyDaysAgo) segments.push("inactive")

        return {
          id: c.id,
          name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email || "Unknown",
          email: c.email || "",
          emailVerified: !!c.metadata?.email_verified,
          phone: c.phone || "",
          avatarUrl: c.metadata?.avatar_url || "",
          joinedAt: c.created_at,
          lastOrderAt,
          totalOrders,
          lifetimeValue,
          averageOrderValue: avgOrderValue,
          currency: (c.metadata?.currency || "INR") as "INR" | "USD",
          loyaltyPoints,
          segments,
          recentOrders,
          addresses,
          reviews: [], // no review module installed
          notes,
        }
      } catch {
        return null
      }
    },
    []
  )

  const addNote = useCallback(
    async (customerId: string, message: string): Promise<AdminNote | null> => {
      try {
        const author = await getAdminAuthor()

        const currentRes = await adminFetch<{ customer: any }>(
          `/admin/customers/${customerId}?fields=id,metadata`
        )
        const existingMeta = currentRes.customer?.metadata || {}
        const existingNotes: AdminNote[] = Array.isArray(existingMeta.admin_notes)
          ? existingMeta.admin_notes
          : []

        const newNote: AdminNote = {
          id: crypto.randomUUID(),
          author,
          message,
          createdAt: new Date().toISOString(),
        }

        await adminFetch(`/admin/customers/${customerId}`, {
          method: "POST",
          body: { metadata: { ...existingMeta, admin_notes: [...existingNotes, newNote] } },
        })

        return newNote
      } catch {
        return null
      }
    },
    []
  )

  return { fetchCustomers, fetchCustomerDetail, addNote }
}
