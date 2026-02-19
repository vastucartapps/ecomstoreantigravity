"use client"

import { useCallback } from "react"
import { medusa } from "@/lib/medusa"
import type {
  ReturnCard,
  ReturnDetail,
  ReturnStatus,
  ReturnReason,
  ReturnTimelineEvent,
  RefundType,
  RefundMethod,
} from "@/types/admin-return"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RETURN_WINDOW_DAYS = 7

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

function mapReturnStatus(r: any): ReturnStatus {
  const displayStatus = r.metadata?.display_status
  if (displayStatus) return displayStatus as ReturnStatus
  if (r.status === "refunded") return "refunded"
  if (r.status === "received") return "approved"
  return "pending"
}

function mapReturnReason(r: any): ReturnReason {
  const reason = r.metadata?.reason || r.reason || "other"
  const valid: ReturnReason[] = [
    "defective", "wrong_item", "not_as_described",
    "changed_mind", "size_issue", "damaged_in_transit", "other",
  ]
  return valid.includes(reason) ? (reason as ReturnReason) : "other"
}

function computeReturnWindow(orderCreatedAt: string, returnCreatedAt: string, windowDays = RETURN_WINDOW_DAYS): boolean {
  const orderDate = new Date(orderCreatedAt).getTime()
  const returnDate = new Date(returnCreatedAt).getTime()
  const diffDays = (returnDate - orderDate) / (1000 * 60 * 60 * 24)
  return diffDays <= windowDays
}

function buildReturnTimeline(r: any): ReturnTimelineEvent[] {
  const initial: ReturnTimelineEvent = {
    id: `${r.id}-requested`,
    action: "Return Requested",
    author: r.order?.customer
      ? `${r.order.customer.first_name || ""} ${r.order.customer.last_name || ""}`.trim() || r.order.customer.email || "Customer"
      : "Customer",
    note: r.metadata?.customer_notes || null,
    timestamp: r.created_at,
  }

  const stored: ReturnTimelineEvent[] = Array.isArray(r.metadata?.timeline)
    ? r.metadata.timeline
    : []

  return [initial, ...stored]
}

function mapMedusaReturnCard(r: any): ReturnCard {
  const order = r.order || {}
  const customer = order.customer || {}
  const items = r.items || []
  const firstItem = items[0] || {}
  const variant = firstItem.variant || {}
  const product = variant.product || {}
  const thumbnail =
    product.thumbnail ||
    variant.metadata?.thumbnail ||
    firstItem.metadata?.thumbnail ||
    ""

  const customerName =
    customer.first_name || customer.last_name
      ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
      : customer.email || "Unknown"

  const requestedAt = r.created_at || new Date().toISOString()
  const daysOpen = Math.floor(
    (Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60 * 24)
  )

  const refundAmount = (r.refund_amount || 0) / 100
  const currency = (order.currency_code?.toUpperCase() || "INR") as "INR" | "USD"

  const variantParts: string[] = []
  if (variant.title && variant.title !== "Default Title") variantParts.push(variant.title)

  return {
    id: r.id,
    orderNumber: order.display_id ? formatOrderNumber(order) : r.order_id || r.id,
    orderId: r.order_id || order.id || "",
    customerName,
    customerEmail: customer.email || "",
    productName: product.title || firstItem.title || "Product",
    productImageUrl: thumbnail,
    variantLabel: variantParts.join(" / "),
    reason: mapReturnReason(r),
    status: mapReturnStatus(r),
    refundAmount,
    currency,
    requestedAt,
    daysOpen,
  }
}

function mapMedusaReturnDetail(r: any): ReturnDetail {
  const order = r.order || {}
  const customer = order.customer || {}
  const items = r.items || []
  const firstItem = items[0] || {}
  const variant = firstItem.variant || {}
  const product = variant.product || {}
  const thumbnail =
    product.thumbnail ||
    variant.metadata?.thumbnail ||
    firstItem.metadata?.thumbnail ||
    ""

  const customerName =
    customer.first_name || customer.last_name
      ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim()
      : customer.email || "Unknown"

  const currency = (order.currency_code?.toUpperCase() || "INR") as "INR" | "USD"

  // Return window
  const isWithinReturnWindow = order.created_at && r.created_at
    ? computeReturnWindow(order.created_at, r.created_at)
    : true

  // Photos from metadata
  const rawPhotos = Array.isArray(r.metadata?.photos) ? r.metadata.photos : []

  // Payment collection id from order
  const paymentCollectionId =
    order.payment_collections?.[0]?.id || null

  // Line item price
  const itemPrice = (firstItem.unit_price || 0) / 100
  const itemQty = firstItem.quantity || 1

  const variantParts: string[] = []
  if (variant.title && variant.title !== "Default Title") variantParts.push(variant.title)

  return {
    id: r.id,
    orderNumber: order.display_id ? formatOrderNumber(order) : r.order_id || r.id,
    orderId: r.order_id || order.id || "",
    status: mapReturnStatus(r),
    customer: {
      id: customer.id || "",
      name: customerName,
      email: customer.email || "",
      phone: customer.phone || "",
    },
    product: {
      id: product.id || "",
      name: product.title || firstItem.title || "Product",
      variantLabel: variantParts.join(" / "),
      imageUrl: thumbnail,
      quantity: itemQty,
      price: itemPrice,
      currency,
    },
    returnItemIds: items.map((i: any) => i.id),
    paymentCollectionId,
    reason: mapReturnReason(r),
    customerNotes: r.metadata?.customer_notes || "",
    photos: rawPhotos.map((p: any, idx: number) => ({
      id: p.id || `photo-${idx}`,
      url: p.url || "",
      caption: p.caption || `Photo ${idx + 1}`,
    })),
    adminNotes: r.metadata?.admin_notes || "",
    refundType: (r.metadata?.refund_type as RefundType) || null,
    refundAmount: (r.refund_amount || 0) / 100,
    refundMethod: (r.metadata?.refund_method as RefundMethod) || null,
    isWithinReturnWindow,
    returnWindowDays: RETURN_WINDOW_DAYS,
    timeline: buildReturnTimeline(r),
    requestedAt: r.created_at || new Date().toISOString(),
    resolvedAt: r.metadata?.resolved_at || null,
  }
}

// ---------------------------------------------------------------------------
// Admin auth helper (reads JWT from cookie for raw fetch)
// ---------------------------------------------------------------------------

function getAdminJwt(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("medusa_auth_token") || ""
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<any> {
  const jwt = getAdminJwt()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  }
  const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Admin API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function getAdminAuthor(): Promise<string> {
  try {
    const data = await adminFetch("/admin/users/me")
    const user = data.user
    if (!user) return "Admin"
    return user.first_name || user.last_name
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : user.email || "Admin"
  } catch {
    return "Admin"
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminReturns() {
  const fetchReturns = useCallback(
    async (searchQuery = "", page = 1, perPage = 50): Promise<{ cards: ReturnCard[]; totalCount: number }> => {
      const offset = (page - 1) * perPage
      const params = new URLSearchParams({
        limit: String(perPage),
        offset: String(offset),
        fields: "id,status,order_id,created_at,refund_amount,currency_code,metadata,*order,*items",
      })
      if (searchQuery) params.set("q", searchQuery)

      const data = await adminFetch(`/admin/returns?${params}`)
      const allReturns: any[] = data.returns || []
      const totalCount: number = data.count || allReturns.length

      const cards = allReturns
        .filter((r) => {
          // Exclude rejected from kanban (they still exist in DB, just hidden)
          const status = mapReturnStatus(r)
          return status !== "rejected"
        })
        .map(mapMedusaReturnCard)

      return { cards, totalCount }
    },
    []
  )

  const fetchReturnDetail = useCallback(async (id: string): Promise<ReturnDetail | null> => {
    try {
      const data = await adminFetch(
        `/admin/returns/${id}?fields=id,status,order_id,created_at,refund_amount,currency_code,metadata,*order,*items`
      )
      return mapMedusaReturnDetail(data.return)
    } catch {
      return null
    }
  }, [])

  const moveReturn = useCallback(async (id: string, newStatus: ReturnStatus): Promise<boolean> => {
    try {
      await adminFetch(`/admin/returns/${id}`, {
        method: "POST",
        body: JSON.stringify({
          metadata: { display_status: newStatus },
        }),
      })
      return true
    } catch {
      return false
    }
  }, [])

  const approveReturn = useCallback(
    async (id: string, notes: string): Promise<boolean> => {
      try {
        // Fetch existing metadata to preserve it
        const existing = await adminFetch(
          `/admin/returns/${id}?fields=id,metadata`
        )
        const existingMeta = existing.return?.metadata || {}
        const existingTimeline: ReturnTimelineEvent[] = Array.isArray(existingMeta.timeline)
          ? existingMeta.timeline
          : []

        const author = await getAdminAuthor()
        const newEvent: ReturnTimelineEvent = {
          id: crypto.randomUUID(),
          action: "Return Approved",
          author,
          note: notes || null,
          timestamp: new Date().toISOString(),
        }

        await adminFetch(`/admin/returns/${id}`, {
          method: "POST",
          body: JSON.stringify({
            metadata: {
              ...existingMeta,
              display_status: "approved",
              admin_notes: notes,
              timeline: [...existingTimeline, newEvent],
            },
          }),
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const rejectReturn = useCallback(
    async (id: string, notes: string): Promise<boolean> => {
      try {
        const existing = await adminFetch(`/admin/returns/${id}?fields=id,metadata`)
        const existingMeta = existing.return?.metadata || {}
        const existingTimeline: ReturnTimelineEvent[] = Array.isArray(existingMeta.timeline)
          ? existingMeta.timeline
          : []

        const author = await getAdminAuthor()
        const newEvent: ReturnTimelineEvent = {
          id: crypto.randomUUID(),
          action: "Return Rejected",
          author,
          note: notes || null,
          timestamp: new Date().toISOString(),
        }

        await adminFetch(`/admin/returns/${id}`, {
          method: "POST",
          body: JSON.stringify({
            metadata: {
              ...existingMeta,
              display_status: "rejected",
              admin_notes: notes,
              resolved_at: new Date().toISOString(),
              timeline: [...existingTimeline, newEvent],
            },
          }),
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const processRefund = useCallback(
    async (
      id: string,
      type: RefundType,
      amount: number,
      method: RefundMethod,
      orderId: string,
      paymentCollectionId?: string | null
    ): Promise<{ success: boolean; giftCardCode?: string }> => {
      try {
        const amountInMinorUnits = Math.round(amount * 100)
        let giftCardCode: string | undefined

        if (method === "original_payment") {
          // Refund to original payment method
          const body: Record<string, any> = {
            amount: amountInMinorUnits,
            note: `Return refund — ${type === "full" ? "Full" : "Partial"} refund`,
          }
          if (paymentCollectionId) {
            body.payment_collection_id = paymentCollectionId
          }
          await adminFetch(`/admin/orders/${orderId}/refunds`, {
            method: "POST",
            body: JSON.stringify(body),
          })
        } else {
          // Store credit via gift card
          const gcData = await adminFetch("/admin/gift-cards", {
            method: "POST",
            body: JSON.stringify({
              value: amountInMinorUnits,
              currency_code: "inr",
            }),
          })
          giftCardCode = gcData.gift_card?.code
        }

        // Update return metadata
        const existing = await adminFetch(`/admin/returns/${id}?fields=id,metadata`)
        const existingMeta = existing.return?.metadata || {}
        const existingTimeline: ReturnTimelineEvent[] = Array.isArray(existingMeta.timeline)
          ? existingMeta.timeline
          : []

        const author = await getAdminAuthor()
        const newEvent: ReturnTimelineEvent = {
          id: crypto.randomUUID(),
          action: method === "original_payment" ? "Refund Processed" : "Store Credit Issued",
          author,
          note: giftCardCode ? `Gift card code: ${giftCardCode}` : null,
          timestamp: new Date().toISOString(),
        }

        await adminFetch(`/admin/returns/${id}`, {
          method: "POST",
          body: JSON.stringify({
            metadata: {
              ...existingMeta,
              display_status: "refunded",
              refund_type: type,
              refund_method: method,
              resolved_at: new Date().toISOString(),
              timeline: [...existingTimeline, newEvent],
            },
          }),
        })

        return { success: true, giftCardCode }
      } catch {
        return { success: false }
      }
    },
    []
  )

  const initiateExchange = useCallback(
    async (returnId: string, orderId: string, returnItemIds: string[]): Promise<boolean> => {
      try {
        await adminFetch(`/admin/orders/${orderId}/exchanges`, {
          method: "POST",
          body: JSON.stringify({
            return_items: returnItemIds.map((id) => ({ id })),
            new_items: [],
          }),
        })

        // Add timeline event
        const existing = await adminFetch(`/admin/returns/${returnId}?fields=id,metadata`)
        const existingMeta = existing.return?.metadata || {}
        const existingTimeline: ReturnTimelineEvent[] = Array.isArray(existingMeta.timeline)
          ? existingMeta.timeline
          : []

        const author = await getAdminAuthor()
        const newEvent: ReturnTimelineEvent = {
          id: crypto.randomUUID(),
          action: "Exchange Initiated",
          author,
          note: null,
          timestamp: new Date().toISOString(),
        }

        await adminFetch(`/admin/returns/${returnId}`, {
          method: "POST",
          body: JSON.stringify({
            metadata: {
              ...existingMeta,
              timeline: [...existingTimeline, newEvent],
            },
          }),
        })

        return true
      } catch {
        return false
      }
    },
    []
  )

  return {
    fetchReturns,
    fetchReturnDetail,
    moveReturn,
    approveReturn,
    rejectReturn,
    processRefund,
    initiateExchange,
  }
}
