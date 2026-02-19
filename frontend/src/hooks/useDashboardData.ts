import { useCallback } from "react"
import { medusa } from "@/lib/medusa"
import type { Order, Address, LoyaltyBalance, Booking, CustomerNotification, Coupon } from "@/types/dashboard"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function authHeaders() {
  return { "x-publishable-api-key": PUB_KEY }
}

function mapMedusaOrder(o: any): Order {
  const year = new Date(o.created_at).getFullYear()
  const mmdd = new Date(o.created_at).toLocaleDateString("en-IN", { month: "2-digit", day: "2-digit" }).replace("/", "")
  const orderNumber = `VC-${year}-${mmdd}-${String(o.display_id || "").padStart(4, "0")}`

  const statusMap: Record<string, Order["status"]> = {
    pending: "processing",
    completed: "delivered",
    cancelled: "cancelled",
    archived: "delivered",
    requires_action: "pending",
  }

  const items = (o.items || []).map((item: any) => ({
    id: item.id,
    productTitle: item.product_title || item.title || "Product",
    variantTitle: item.variant_title,
    thumbnail: item.thumbnail,
    quantity: item.quantity,
    unitPrice: (item.unit_price || 0) / 100,
    total: ((item.unit_price || 0) / 100) * item.quantity,
  }))

  const addr = o.shipping_address
  const shippingAddress = addr
    ? [addr.first_name, addr.last_name, addr.address_1, addr.city, addr.province, addr.postal_code]
        .filter(Boolean)
        .join(", ")
    : undefined

  // Build timeline
  const timeline = buildTimeline(o)

  // Check admin-set display_status override first (set via admin dashboard)
  const displayStatus = o.metadata?.display_status
  const resolvedStatus: Order["status"] = displayStatus
    ? (displayStatus as Order["status"])
    : statusMap[o.status] || "processing"

  return {
    id: o.id,
    orderNumber,
    orderDate: new Date(o.created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    status: resolvedStatus,
    items,
    itemCount: items.reduce((s: number, i: any) => s + i.quantity, 0),
    total: (o.total || 0) / 100,
    currency: (o.currency_code || "inr").toUpperCase(),
    paymentMethod: o.payment_collections?.[0]?.payment_provider_id || "online",
    shippingAddress,
    trackingNumber: o.fulfillments?.[0]?.tracking_numbers?.[0],
    timeline,
  }
}

function buildTimeline(o: any): import("@/types/dashboard").OrderTimelineStep[] {
  const steps: import("@/types/dashboard").OrderTimelineStep[] = [
    { label: "Order Placed", date: formatDate(o.created_at), completed: true, current: false },
    { label: "Order Confirmed", date: formatDate(o.payment_collections?.[0]?.payments?.[0]?.created_at), completed: !!o.payment_collections?.[0]?.payments?.[0], current: false },
    { label: "Shipped", date: formatDate(o.fulfillments?.[0]?.shipped_at), completed: !!o.fulfillments?.[0]?.shipped_at, current: false },
    { label: "Out for Delivery", date: undefined, completed: false, current: false },
    { label: "Delivered", date: formatDate(o.fulfillments?.[0]?.delivered_at), completed: o.status === "completed", current: false },
  ]

  // Mark current step
  let lastCompleted = -1
  steps.forEach((s, i) => { if (s.completed) lastCompleted = i })
  if (lastCompleted < steps.length - 1) {
    steps[lastCompleted + 1].current = true
  }

  return steps
}

function formatDate(d?: string): string | undefined {
  if (!d) return undefined
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function mapMedusaAddress(a: any): Address {
  return {
    id: a.id,
    name: [a.first_name, a.last_name].filter(Boolean).join(" "),
    phone: a.phone,
    street: a.address_1 || "",
    city: a.city || "",
    state: a.province || "",
    pincode: a.postal_code || "",
    country: a.country_code?.toUpperCase() || "IN",
    isDefault: !!a.is_default_shipping,
    label: a.metadata?.label,
  }
}

export function useDashboardData() {
  const fetchOrders = useCallback(async (limit = 20): Promise<Order[]> => {
    const result = await medusa.store.order.list({ limit })
    const orders = (result as any).orders || []
    return orders.map(mapMedusaOrder)
  }, [])

  const fetchAddresses = useCallback(async (): Promise<Address[]> => {
    const result = await medusa.store.customer.listAddress()
    const addresses = (result as any).addresses || []
    return addresses.map(mapMedusaAddress)
  }, [])

  const createAddress = useCallback(async (data: Omit<Address, "id" | "isDefault">) => {
    return medusa.store.customer.createAddress({
      first_name: data.name.split(" ")[0] || "",
      last_name: data.name.split(" ").slice(1).join(" ") || "",
      phone: data.phone,
      address_1: data.street,
      city: data.city,
      province: data.state,
      postal_code: data.pincode,
      country_code: data.country.toLowerCase(),
      metadata: { label: data.label },
    })
  }, [])

  const updateAddress = useCallback(async (id: string, data: Partial<Address>) => {
    const updateData: any = {}
    if (data.name) {
      const parts = data.name.split(" ")
      updateData.first_name = parts[0]
      updateData.last_name = parts.slice(1).join(" ")
    }
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.street) updateData.address_1 = data.street
    if (data.city) updateData.city = data.city
    if (data.state) updateData.province = data.state
    if (data.pincode) updateData.postal_code = data.pincode
    if (data.country) updateData.country_code = data.country.toLowerCase()
    if (data.label) updateData.metadata = { label: data.label }
    return medusa.store.customer.updateAddress(id, updateData)
  }, [])

  const deleteAddress = useCallback(async (id: string) => {
    return medusa.store.customer.deleteAddress(id)
  }, [])

  const fetchLoyalty = useCallback(async (): Promise<LoyaltyBalance> => {
    const res = await fetch(`${BACKEND_URL}/store/customers/me/loyalty`, {
      headers: authHeaders(),
      credentials: "include",
    })
    if (!res.ok) return { balance: 0, transactions: [] }
    return res.json()
  }, [])

  const fetchBookings = useCallback(async (): Promise<Booking[]> => {
    const res = await fetch(`${BACKEND_URL}/store/customers/me/bookings`, {
      headers: authHeaders(),
      credentials: "include",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.bookings || []
  }, [])

  const createBooking = useCallback(async (data: {
    title: string
    consultant_name?: string
    date: string
    time: string
    notes?: string
  }): Promise<Booking> => {
    const res = await fetch(`${BACKEND_URL}/store/customers/me/bookings`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    })
    const result = await res.json()
    return result.booking
  }, [])

  const fetchNotifications = useCallback(async (
    filters: { type?: string; limit?: number; offset?: number } = {}
  ): Promise<{ notifications: CustomerNotification[]; unread_count: number }> => {
    const params = new URLSearchParams()
    if (filters.type) params.set("type", filters.type)
    if (filters.limit) params.set("limit", String(filters.limit))
    if (filters.offset) params.set("offset", String(filters.offset))

    const res = await fetch(
      `${BACKEND_URL}/store/customers/me/notifications?${params}`,
      { headers: authHeaders(), credentials: "include" }
    )
    if (!res.ok) return { notifications: [], unread_count: 0 }
    return res.json()
  }, [])

  const markNotificationRead = useCallback(async (id?: string) => {
    await fetch(`${BACKEND_URL}/store/customers/me/notifications/mark-read`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(id ? { notification_id: id } : {}),
    })
  }, [])

  const fetchCoupons = useCallback(async (): Promise<Coupon[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/store/promotions`, {
        headers: authHeaders(),
      })
      if (!res.ok) return []
      const data = await res.json()
      const promotions = data.promotions || []
      return promotions
        .filter((p: any) => p.status === "active" || !p.status)
        .map((p: any): Coupon => ({
          id: p.id,
          code: p.code || "",
          description: p.description || "Discount offer",
          discountType: p.application_method?.type === "percentage" ? "percentage" : "fixed",
          discountValue: p.application_method?.value || 0,
          minOrderValue: p.rules?.find((r: any) => r.attribute === "subtotal")?.value / 100,
          expiresAt: p.ends_at,
          isActive: true,
        }))
    } catch {
      return []
    }
  }, [])

  return {
    fetchOrders,
    fetchAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    fetchLoyalty,
    fetchBookings,
    createBooking,
    fetchNotifications,
    markNotificationRead,
    fetchCoupons,
  }
}
