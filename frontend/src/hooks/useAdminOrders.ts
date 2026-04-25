"use client"

import { useCallback } from "react"
import { medusa, adminFetch } from "@/lib/medusa"
import { normalizeImageUrl } from "@/lib/image-url"
import type {
  OrderRow,
  OrderDetail,
  OrderNote,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  TimelineEvent,
  OrderFilters,
  OrderItem,
  ShippingAddress,
  PaymentDetails,
  OrderCustomer,
} from "@/types/admin-order"
import {
  generateGSTInvoicePDF,
  type InvoiceData,
  type InvoiceItem,
} from "@/lib/invoice-generator"
import type {
  MedusaAdminUser,
  MedusaOrder,
  MedusaOrderItem,
  MedusaPaymentCollection,
} from "@/types/medusa-api"

// ---------------------------------------------------------------------------
// Timeline step definitions
// ---------------------------------------------------------------------------

const TIMELINE_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "processing", label: "Order Placed" },
  { status: "accepted", label: "Order Accepted" },
  { status: "shipped", label: "Shipped" },
  { status: "in_transit", label: "In Transit" },
  { status: "out_for_delivery", label: "Out for Delivery" },
  { status: "delivered", label: "Delivered" },
]

const CANCELLED_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "cancelled", label: "Order Cancelled" },
]

const RETURNED_STEPS: Array<{ status: OrderStatus; label: string }> = [
  { status: "returned", label: "Order Returned" },
]

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function formatOrderNumber(order: MedusaOrder): string {
  const date = new Date(order.created_at || 0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const id = String(order.display_id || "0").padStart(4, "0")
  return `VC-${year}-${month}${day}-${id}`
}

function mapOrderStatus(order: MedusaOrder): OrderStatus {
  const meta = order.metadata?.display_status as OrderStatus | undefined
  if (meta) return meta
  const status = order.status
  const payStatus = order.payment_status
  if (status === "cancelled") return "cancelled"
  if (status === "completed") return "delivered"
  if (status === "returned") return "returned"
  if (payStatus === "awaiting" || status === "pending") return "processing"
  if (status === "requires_action") return "processing"
  return "processing"
}

function mapPaymentMethod(providerId?: string): PaymentMethod {
  if (!providerId) return "razorpay"
  const id = providerId.toLowerCase()
  if (id.includes("razorpay")) return "razorpay"
  if (id.includes("stripe")) return "stripe"
  if (id.includes("paypal")) return "wallet"
  if (id.includes("cod") || id.includes("manual")) return "cod"
  if (id.includes("upi")) return "upi"
  if (id.includes("netbanking")) return "netbanking"
  if (id.includes("wallet")) return "wallet"
  return "razorpay"
}

function mapPaymentStatus(collection?: MedusaPaymentCollection): PaymentStatus {
  if (!collection) return "pending"
  const status = collection.status
  if (status === "captured" || status === "partially_captured") return "paid"
  if (status === "refunded" || status === "partially_refunded") return "refunded"
  if (status === "canceled" || status === "voided") return "failed"
  return "pending"
}

function mapMedusaOrderRow(o: MedusaOrder): OrderRow {
  const collection = (o.payment_collections || [])[0]
  const payment = (collection?.payments || [])[0]
  return {
    id: o.id,
    orderNumber: formatOrderNumber(o),
    customerName:
      [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") ||
      o.customer?.email ||
      o.email ||
      "Unknown",
    customerEmail: o.customer?.email || o.email || "",
    itemCount: (o.items || []).length,
    total: Math.round((o.total || 0) / 100),
    currency: (o.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
    status: mapOrderStatus(o),
    paymentMethod: mapPaymentMethod(payment?.provider_id),
    paymentStatus: mapPaymentStatus(collection),
    date: o.created_at || "",
  }
}

function buildTimeline(order: MedusaOrder, displayStatus: OrderStatus): TimelineEvent[] {
  if (displayStatus === "cancelled") {
    return [
      {
        id: "cancelled",
        status: "cancelled",
        label: "Order Cancelled",
        timestamp: order.updated_at || null,
        note: null,
        isCompleted: true,
        isCurrent: true,
      },
    ]
  }

  if (displayStatus === "returned") {
    return [
      {
        id: "returned",
        status: "returned",
        label: "Order Returned",
        timestamp: order.updated_at || null,
        note: null,
        isCompleted: true,
        isCurrent: true,
      },
    ]
  }

  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.status === displayStatus)
  const fulfillment = (order.fulfillments || [])[0]

  // Timestamps per step
  const timestamps: Partial<Record<OrderStatus, string | null>> = {
    processing: order.created_at || null,
    accepted: (order.metadata?.accepted_at as string | undefined) || null,
    shipped: fulfillment?.created_at || (order.metadata?.shipped_at as string | undefined) || null,
    in_transit: (order.metadata?.in_transit_at as string | undefined) || null,
    out_for_delivery: (order.metadata?.out_for_delivery_at as string | undefined) || null,
    delivered: (order.metadata?.delivered_at as string | undefined) || (order.status === "completed" ? order.updated_at : null),
  }

  return TIMELINE_STEPS.map((step, idx) => ({
    id: step.status,
    status: step.status,
    label: step.label,
    timestamp: idx <= currentIdx ? (timestamps[step.status] || null) : null,
    note: null,
    isCompleted: idx < currentIdx,
    isCurrent: idx === currentIdx,
  }))
}

function mapMedusaOrderDetail(o: MedusaOrder, customerOrderCount: number): OrderDetail {
  const collection = (o.payment_collections || [])[0]
  const payment = (collection?.payments || [])[0]
  const displayStatus = mapOrderStatus(o)
  const addr = o.shipping_address || {}

  const customer: OrderCustomer = {
    id: o.customer?.id || "",
    name:
      [o.customer?.first_name, o.customer?.last_name].filter(Boolean).join(" ") ||
      o.customer?.email ||
      o.email ||
      "Unknown",
    email: o.customer?.email || o.email || "",
    phone: o.customer?.phone || addr.phone || "",
    totalOrders: customerOrderCount,
  }

  const shippingAddress: ShippingAddress = {
    name: [addr.first_name, addr.last_name].filter(Boolean).join(" ") || customer.name,
    phone: addr.phone || customer.phone || "",
    street: addr.address_1 || "",
    city: addr.city || "",
    state: addr.province || "",
    pincode: addr.postal_code || "",
    country: addr.country_code?.toUpperCase() || addr.country || "",
  }

  const paymentDetails: PaymentDetails = {
    method: mapPaymentMethod(payment?.provider_id),
    status: mapPaymentStatus(collection),
    transactionId: (payment?.data?.id as string | undefined) || (payment?.data?.razorpay_payment_id as string | undefined) || payment?.id || "",
    amount: Math.round((payment?.amount || o.total || 0) / 100),
    currency: (o.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
    paidAt: payment?.captured_at || null,
  }

  const items: OrderItem[] = (o.items || []).map((item: MedusaOrderItem) => ({
    id: item.id,
    productName: item.title || item.product_title || "",
    variantLabel: item.variant_title || item.subtitle || "",
    imageUrl: normalizeImageUrl(item.thumbnail || ""),
    quantity: item.quantity || 1,
    price: Math.round((item.unit_price || 0) / 100),
    lineTotal: Math.round((item.subtotal || (item.unit_price || 0) * (item.quantity || 1)) / 100),
    currency: (o.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
  }))

  const fulfillment = (o.fulfillments || [])[0]
  const trackingNumber: string | null =
    (o.metadata?.tracking_number as string | undefined) ||
    (fulfillment?.tracking_numbers || [])[0] ||
    null
  const trackingUrl: string | null =
    (o.metadata?.tracking_url as string | undefined) ||
    (fulfillment?.tracking_urls || [])[0] ||
    null

  const notes: OrderNote[] = Array.isArray(o.metadata?.notes) ? (o.metadata.notes as OrderNote[]) : []

  return {
    id: o.id,
    orderNumber: formatOrderNumber(o),
    status: displayStatus,
    customer,
    shippingAddress,
    payment: paymentDetails,
    items,
    timeline: buildTimeline(o, displayStatus),
    notes,
    subtotal: Math.round((o.subtotal || 0) / 100),
    discount: Math.round((o.discount_total || 0) / 100),
    shippingFee: Math.round((o.shipping_total || 0) / 100),
    tax: Math.round((o.tax_total || 0) / 100),
    total: Math.round((o.total || 0) / 100),
    currency: (o.currency_code?.toUpperCase() || "INR") as "INR" | "USD",
    trackingNumber,
    trackingUrl,
    carrier: (o.metadata?.carrier as string | undefined) || null,
    createdAt: o.created_at || "",
    updatedAt: o.updated_at || "",
  }
}

// ---------------------------------------------------------------------------
// Custom display statuses that require client-side filtering
// (not directly filterable via Medusa native status)
// ---------------------------------------------------------------------------

const CUSTOM_DISPLAY_STATUSES: OrderStatus[] = [
  "accepted",
  "shipped",
  "in_transit",
  "out_for_delivery",
]

// Statuses that map to Medusa native status for server-side filtering
function getNativeMedusaStatuses(status: OrderStatus | "all"): string[] | null {
  if (status === "all") return null
  if (status === "cancelled") return ["cancelled"]
  if (status === "delivered") return ["completed"]
  if (status === "returned") return ["returned"]
  if (CUSTOM_DISPLAY_STATUSES.includes(status)) return null // client-side only
  return null
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

function applySortClientSide(rows: OrderRow[], sortField: string, sortDirection: string): OrderRow[] {
  if (sortField === "customer") {
    return [...rows].sort((a, b) => {
      const cmp = a.customerName.localeCompare(b.customerName)
      return sortDirection === "asc" ? cmp : -cmp
    })
  }
  if (sortField === "status") {
    return [...rows].sort((a, b) => {
      const cmp = a.status.localeCompare(b.status)
      return sortDirection === "asc" ? cmp : -cmp
    })
  }
  return rows
}

// ---------------------------------------------------------------------------
// Admin profile helper
// ---------------------------------------------------------------------------

async function getAdminAuthor(): Promise<string> {
  try {
    const res = await adminFetch<{ user: MedusaAdminUser | null }>("/admin/users/me")
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

export function useAdminOrders() {
  const fetchOrders = useCallback(
    async (
      filters: OrderFilters,
      cursor: string | null,
      limit: number
    ): Promise<{ rows: OrderRow[]; nextCursor: string | null; hasMore: boolean; totalCount: number }> => {
      const needsClientFilter =
        filters.status !== "all" &&
        CUSTOM_DISPLAY_STATUSES.includes(filters.status as OrderStatus)

      // Over-fetch for hasMore detection; extra over-fetch for client-side filtered statuses
      const fetchLimit = needsClientFilter ? limit * 5 : limit + 1

      const params = new URLSearchParams()
      params.set("limit", String(fetchLimit))
      params.set(
        "fields",
        "id,display_id,status,payment_status,total,currency_code,created_at,email,metadata,*customer,*items,*payment_collections"
      )

      // Keyset cursor: fetch records older than cursor
      if (cursor) params.set("created_at[lt]", cursor)

      if (filters.search) params.set("q", filters.search)

      if (filters.dateFrom) {
        params.set("created_at[gte]", new Date(filters.dateFrom).toISOString())
      }
      if (filters.dateTo) {
        const end = new Date(filters.dateTo)
        end.setDate(end.getDate() + 1)
        params.set("created_at[lte]", end.toISOString())
      }

      const nativeStatuses = getNativeMedusaStatuses(filters.status)
      if (nativeStatuses) {
        nativeStatuses.forEach((s) => params.append("status[]", s))
      }

      // Always sort by created_at desc — required for keyset to work correctly
      params.set("order", "-created_at")

      const res = await adminFetch<{ orders: MedusaOrder[]; count: number }>(
        `/admin/orders?${params.toString()}`
      )

      let rows = (res.orders || []).map(mapMedusaOrderRow)

      // Client-side display_status filter for custom statuses stored in metadata
      if (needsClientFilter) {
        rows = rows.filter((r) => r.status === filters.status)
      } else if (filters.status === "processing") {
        rows = rows.filter((r) => r.status === "processing")
      }

      // Client-side sort for fields not sortable server-side
      if (filters.sortField === "customer" || filters.sortField === "status") {
        rows = applySortClientSide(rows, filters.sortField, filters.sortDirection)
      }

      const hasMore = needsClientFilter
        ? rows.length >= limit
        : (res.orders || []).length > limit

      const paginatedRows = rows.slice(0, limit)

      // nextCursor = created_at of the last shown row (used as created_at[lt] for next page)
      const lastRow = paginatedRows[paginatedRows.length - 1]
      const nextCursor = hasMore && lastRow ? lastRow.date : null

      // totalCount from API — only meaningful on first page (cursor === null);
      // caller caches it for display across subsequent pages.
      const totalCount = cursor === null ? (res.count ?? paginatedRows.length) : 0

      return { rows: paginatedRows, nextCursor, hasMore, totalCount }
    },
    []
  )

  const fetchOrderDetail = useCallback(async (id: string): Promise<OrderDetail | null> => {
    try {
      const res = await adminFetch<{ order: MedusaOrder }>(
        `/admin/orders/${id}?fields=id,display_id,status,payment_status,total,subtotal,discount_total,shipping_total,tax_total,currency_code,email,created_at,updated_at,metadata,*customer,*items,*shipping_address,*fulfillments,*payment_collections`
      )
      const order = res.order
      if (!order) return null

      // Fetch customer order count
      let customerOrderCount = 0
      if (order.customer?.id) {
        try {
          const countRes = await adminFetch<{ count: number }>(
            `/admin/orders?customer_id=${order.customer.id}&fields=id&limit=1`
          )
          customerOrderCount = countRes.count || 0
        } catch {
          customerOrderCount = 0
        }
      }

      return mapMedusaOrderDetail(order, customerOrderCount)
    } catch {
      return null
    }
  }, [])

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      trackingNumber?: string,
      carrier?: string
    ): Promise<boolean> => {
      try {
        // Build metadata update
        const metadataUpdate: Record<string, unknown> = {
          display_status: status,
        }

        if (trackingNumber !== undefined) metadataUpdate.tracking_number = trackingNumber
        if (carrier !== undefined) metadataUpdate.carrier = carrier

        // Add status timestamp
        const tsKey = `${status}_at`
        metadataUpdate[tsKey] = new Date().toISOString()

        await adminFetch(`/admin/orders/${orderId}`, {
          method: "POST",
          body: { metadata: metadataUpdate },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const addOrderNote = useCallback(
    async (orderId: string, message: string): Promise<OrderNote | null> => {
      try {
        const author = await getAdminAuthor()

        // Fetch current metadata
        const currentRes = await adminFetch<{ order: MedusaOrder }>(
          `/admin/orders/${orderId}?fields=id,metadata`
        )
        const existingMeta = currentRes.order?.metadata || {}
        const existingNotes: OrderNote[] = Array.isArray(existingMeta.notes)
          ? existingMeta.notes
          : []

        const newNote: OrderNote = {
          id: crypto.randomUUID(),
          author,
          message,
          createdAt: new Date().toISOString(),
        }

        const updatedNotes = [...existingNotes, newNote]

        await adminFetch(`/admin/orders/${orderId}`, {
          method: "POST",
          body: { metadata: { ...existingMeta, notes: updatedNotes } },
        })

        return newNote
      } catch {
        return null
      }
    },
    []
  )

  const downloadInvoice = useCallback(async (orderId: string): Promise<void> => {
    const order = await fetchOrderDetail(orderId)
    if (!order) throw new Error("Order not found")

    // Pull seller info from admin (branding + GST config) so the invoice
    // header / GSTIN / address match what's saved — no hardcoded values.
    const { fetchInvoiceSeller } = await import("@/lib/seller-from-admin")
    const seller = await fetchInvoiceSeller()

    const invoiceItems: InvoiceItem[] = order.items.map((item) => ({
      name: item.productName + (item.variantLabel ? ` — ${item.variantLabel}` : ""),
      hsn: "",
      quantity: item.quantity,
      rate: item.price,
      gstRate: 12, // Default GST rate for handicrafts/puja items
      buyerState: order.shippingAddress.state,
    }))

    const invoiceData: InvoiceData = {
      orderId: order.orderNumber,
      orderDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      shippingAddress: {
        address1: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.pincode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      },
      items: invoiceItems,
      shippingCharge: order.shippingFee,
      currency: order.currency,
      seller,
    }

    await generateGSTInvoicePDF(invoiceData)
  }, [fetchOrderDetail])

  const emailCustomer = useCallback((order: OrderDetail): void => {
    const subject = encodeURIComponent(`Re: Your Order ${order.orderNumber}`)
    const body = encodeURIComponent(
      `Dear ${order.customer.name},\n\nRegarding your order ${order.orderNumber} placed on ${new Date(order.createdAt).toLocaleDateString("en-IN")}.\n\n`
    )
    window.open(`mailto:${order.customer.email}?subject=${subject}&body=${body}`, "_blank")
  }, [])

  return {
    fetchOrders,
    fetchOrderDetail,
    updateOrderStatus,
    addOrderNote,
    downloadInvoice,
    emailCustomer,
  }
}
