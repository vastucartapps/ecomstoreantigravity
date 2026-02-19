"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Download,
  Mail,
  Package,
  CreditCard,
  MapPin,
  User,
  Check,
  Circle,
  Loader2,
} from "lucide-react"
import type {
  OrderDetailPageProps,
  OrderDetail,
  TimelineEvent,
  OrderNote,
  OrderItem,
  OrderStatus,
} from "@/types/admin-order"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
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

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  processing: { bg: c.warningLight, text: c.warning, border: c.warning },
  accepted: { bg: c.primary50, text: c.primary500, border: c.primary400 },
  shipped: { bg: c.primary100, text: c.primary500, border: c.primary400 },
  in_transit: { bg: c.primary200, text: c.primary500, border: c.primary400 },
  out_for_delivery: { bg: c.secondary50, text: c.secondary500, border: c.secondary300 },
  delivered: { bg: c.successLight, text: c.success, border: c.success },
  cancelled: { bg: c.errorLight, text: c.error, border: c.error },
  returned: { bg: c.errorLight, text: c.error, border: c.error },
}

const paymentStatusColors: Record<string, { bg: string; text: string }> = {
  paid: { bg: c.successLight, text: c.success },
  pending: { bg: c.warningLight, text: c.warning },
  failed: { bg: c.errorLight, text: c.error },
  refunded: { bg: c.errorLight, text: c.error },
}

const statusLabels: Record<string, string> = {
  processing: "Processing",
  accepted: "Accepted",
  shipped: "Shipped",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : "$"
  return `${symbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.processing
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
        fontFamily: fonts.body,
      }}
    >
      {status === "processing" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === "delivered" && <Check className="w-3.5 h-3.5" />}
      {status === "shipped" && <Package className="w-3.5 h-3.5" />}
      <span>{statusLabels[status] || status}</span>
    </span>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const colors = paymentStatusColors[status] || paymentStatusColors.pending
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: fonts.body }}
    >
      <span className="capitalize">{status}</span>
    </span>
  )
}

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div
      className="flex items-start gap-4 py-4 border-b last:border-b-0"
      style={{ borderColor: c.subtle }}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="w-16 h-16 object-cover rounded flex-shrink-0"
          style={{ border: `1px solid ${c.subtle}` }}
        />
      ) : (
        <div
          className="w-16 h-16 rounded flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: c.bg, border: `1px solid ${c.subtle}` }}
        >
          <Package size={24} color={c.earth300} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium" style={{ color: c.earth700, fontFamily: fonts.body }}>
          {item.productName}
        </div>
        {item.variantLabel && (
          <div className="text-sm mt-0.5" style={{ color: c.earth400, fontFamily: fonts.body }}>
            {item.variantLabel}
          </div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm" style={{ color: c.earth500, fontFamily: fonts.body }}>
          {item.quantity} × {formatCurrency(item.price, item.currency)}
        </div>
        <div className="font-semibold mt-0.5" style={{ color: c.earth700, fontFamily: fonts.body }}>
          {formatCurrency(item.lineTotal, item.currency)}
        </div>
      </div>
    </div>
  )
}

function TimelineStep({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {event.isCompleted ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: c.success }}
          >
            <Check className="w-5 h-5 text-white" />
          </div>
        ) : event.isCurrent ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 relative flex-shrink-0"
            style={{ borderColor: c.primary400, backgroundColor: c.primary50 }}
          >
            <Circle className="w-4 h-4" style={{ color: c.primary500 }} />
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
              style={{ backgroundColor: c.primary200 }}
            />
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
            style={{ borderColor: c.earth300, backgroundColor: c.card }}
          >
            <Circle className="w-4 h-4" style={{ color: c.earth300 }} />
          </div>
        )}
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[2rem] mt-1"
            style={{ backgroundColor: event.isCompleted ? c.success : c.earth300 }}
          />
        )}
      </div>
      <div className="flex-1 pb-6">
        <div className="font-medium" style={{ color: c.earth700, fontFamily: fonts.body }}>
          {event.label}
        </div>
        {event.timestamp && (
          <div className="text-sm mt-0.5" style={{ color: c.earth400, fontFamily: fonts.body }}>
            {formatDateTime(event.timestamp)}
          </div>
        )}
        {event.note && (
          <div
            className="text-sm mt-2 px-3 py-2 rounded"
            style={{ backgroundColor: c.subtle, color: c.earth600, fontFamily: fonts.body }}
          >
            {event.note}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteItem({ note }: { note: OrderNote }) {
  return (
    <div
      className="pb-4 mb-4 border-b last:border-b-0 last:mb-0 last:pb-0"
      style={{ borderColor: c.subtle }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: c.primary50, color: c.primary500, fontFamily: fonts.body }}
        >
          {note.author}
        </span>
        <span className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
          {formatDateTime(note.createdAt)}
        </span>
      </div>
      <div className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
        {note.message}
      </div>
    </div>
  )
}

export function OrderDetailPage({
  order,
  onBack,
  onUpdateStatus,
  onAddNote,
  onDownloadInvoice,
  onEmailCustomer,
}: OrderDetailPageProps) {
  const [newNote, setNewNote] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status)
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || "")
  const [carrier, setCarrier] = useState(order.carrier || "")
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim() || !onAddNote) return
    setIsSavingNote(true)
    try {
      await onAddNote(order.id, newNote.trim())
      setNewNote("")
    } finally {
      setIsSavingNote(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!onUpdateStatus) return
    setIsUpdatingStatus(true)
    try {
      const needsTracking = ["shipped", "in_transit", "out_for_delivery", "delivered"].includes(
        selectedStatus
      )
      await onUpdateStatus(
        order.id,
        selectedStatus,
        needsTracking ? trackingNumber : undefined,
        needsTracking ? carrier : undefined
      )
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const showTrackingFields = ["shipped", "in_transit", "out_for_delivery", "delivered"].includes(
    selectedStatus
  )

  return (
    <div style={{ backgroundColor: c.bg }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:opacity-80 transition-opacity"
              style={{ backgroundColor: c.card, border: `1px solid ${c.subtle}` }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: c.earth700 }} />
            </button>
          )}
          <div className="flex-1">
            <h1
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: c.earth700, fontFamily: fonts.heading }}
            >
              Order{" "}
              <span style={{ fontFamily: fonts.mono }}>#{order.orderNumber}</span>
            </h1>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm" style={{ color: c.earth500, fontFamily: fonts.body }}>
            Placed on {formatDate(order.createdAt)}
          </span>
          <span style={{ color: c.earth300 }}>•</span>
          <span className="text-sm" style={{ color: c.earth500, fontFamily: fonts.body }}>
            Last updated {formatDate(order.updatedAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {onDownloadInvoice && (
            <button
              onClick={() => onDownloadInvoice(order.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all hover:opacity-90"
              style={{
                borderColor: c.primary500,
                color: c.primary500,
                backgroundColor: c.card,
                fontFamily: fonts.body,
              }}
            >
              <Download className="w-4 h-4" />
              Download Invoice
            </button>
          )}
          {onEmailCustomer && (
            <button
              onClick={() => onEmailCustomer(order.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all hover:opacity-90"
              style={{
                borderColor: c.secondary500,
                color: c.secondary500,
                backgroundColor: c.card,
                fontFamily: fonts.body,
              }}
            >
              <Mail className="w-4 h-4" />
              Email Customer
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: c.card,
              border: `1px solid ${c.subtle}`,
              boxShadow: c.shadow,
            }}
          >
            <div className="h-1" style={{ background: c.gradient }} />
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-4"
                style={{ color: c.earth700, fontFamily: fonts.heading }}
              >
                Items ({order.items.length})
              </h2>
              <div>
                {order.items.map((item) => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
              </div>

              {/* Price Summary */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: c.subtle }}>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: c.earth500, fontFamily: fonts.body }}>Subtotal</span>
                    <span style={{ color: c.earth700, fontFamily: fonts.body }}>
                      {formatCurrency(order.subtotal, order.currency)}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: c.earth500, fontFamily: fonts.body }}>Discount</span>
                      <span style={{ color: c.success, fontFamily: fonts.body }}>
                        -{formatCurrency(order.discount, order.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span style={{ color: c.earth500, fontFamily: fonts.body }}>Shipping Fee</span>
                    <span style={{ color: c.earth700, fontFamily: fonts.body }}>
                      {formatCurrency(order.shippingFee, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: c.earth500, fontFamily: fonts.body }}>Tax (GST)</span>
                    <span style={{ color: c.earth700, fontFamily: fonts.body }}>
                      {formatCurrency(order.tax, order.currency)}
                    </span>
                  </div>
                  <div
                    className="flex justify-between text-lg font-bold pt-2 border-t"
                    style={{ borderColor: c.subtle }}
                  >
                    <span style={{ color: c.earth700, fontFamily: fonts.heading }}>Total</span>
                    <span style={{ color: c.primary500, fontFamily: fonts.heading }}>
                      {formatCurrency(order.total, order.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: c.card,
              border: `1px solid ${c.subtle}`,
              boxShadow: c.shadow,
            }}
          >
            <div className="h-1" style={{ background: c.gradient }} />
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-6"
                style={{ color: c.earth700, fontFamily: fonts.heading }}
              >
                Order Timeline
              </h2>
              <div>
                {order.timeline.map((event, idx) => (
                  <TimelineStep
                    key={event.id}
                    event={event}
                    isLast={idx === order.timeline.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Status Update Card */}
          {onUpdateStatus && (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: c.card,
                border: `1px solid ${c.subtle}`,
                boxShadow: c.shadow,
              }}
            >
              <div className="h-1" style={{ background: c.gradient }} />
              <div className="p-6">
                <h2
                  className="text-xl font-bold mb-4"
                  style={{ color: c.earth700, fontFamily: fonts.heading }}
                >
                  Update Status
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-2"
                      style={{ color: c.earth700, fontFamily: fonts.body }}
                    >
                      New Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                      className="w-full px-4 py-2 rounded-lg border transition-colors"
                      style={{
                        borderColor: c.subtle,
                        color: c.earth700,
                        fontFamily: fonts.body,
                        backgroundColor: c.card,
                      }}
                    >
                      <option value="processing">Processing</option>
                      <option value="accepted">Accepted</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="out_for_delivery">Out for Delivery</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="returned">Returned</option>
                    </select>
                  </div>

                  {showTrackingFields && (
                    <>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: c.earth700, fontFamily: fonts.body }}
                        >
                          Tracking Number
                        </label>
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Enter tracking number"
                          className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none"
                          style={{
                            borderColor: c.subtle,
                            color: c.earth700,
                            fontFamily: fonts.mono,
                            backgroundColor: c.card,
                          }}
                        />
                      </div>
                      <div>
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: c.earth700, fontFamily: fonts.body }}
                        >
                          Carrier
                        </label>
                        <input
                          type="text"
                          value={carrier}
                          onChange={(e) => setCarrier(e.target.value)}
                          placeholder="e.g., Blue Dart, Delhivery, DTDC"
                          className="w-full px-4 py-2 rounded-lg border transition-colors focus:outline-none"
                          style={{
                            borderColor: c.subtle,
                            color: c.earth700,
                            fontFamily: fonts.body,
                            backgroundColor: c.card,
                          }}
                        />
                      </div>
                    </>
                  )}

                  <button
                    onClick={handleUpdateStatus}
                    disabled={isUpdatingStatus}
                    className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: c.primary500,
                      color: "white",
                      fontFamily: fonts.body,
                    }}
                  >
                    {isUpdatingStatus ? "Updating…" : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: c.card,
              border: `1px solid ${c.subtle}`,
              boxShadow: c.shadow,
            }}
          >
            <div className="h-1" style={{ background: c.gradient }} />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: c.primary50 }}>
                  <User className="w-5 h-5" style={{ color: c.primary500 }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-lg"
                    style={{ color: c.earth700, fontFamily: fonts.heading }}
                  >
                    {order.customer.name}
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
                  {order.customer.email}
                </div>
                {order.customer.phone && (
                  <div className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
                    {order.customer.phone}
                  </div>
                )}
                <div
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium mt-2"
                  style={{
                    backgroundColor: c.secondary50,
                    color: c.secondary500,
                    fontFamily: fonts.body,
                  }}
                >
                  Total Orders: {order.customer.totalOrders}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: c.card,
              border: `1px solid ${c.subtle}`,
              boxShadow: c.shadow,
            }}
          >
            <div className="h-1" style={{ background: c.gradient }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: c.primary50 }}>
                  <MapPin className="w-5 h-5" style={{ color: c.primary500 }} />
                </div>
                <h3
                  className="font-bold"
                  style={{ color: c.earth700, fontFamily: fonts.heading }}
                >
                  Shipping Address
                </h3>
              </div>
              <div
                className="text-sm space-y-1"
                style={{ color: c.earth600, fontFamily: fonts.body }}
              >
                <div className="font-medium" style={{ color: c.earth700 }}>
                  {order.shippingAddress.name}
                </div>
                <div>{order.shippingAddress.street}</div>
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.pincode}
                </div>
                <div>{order.shippingAddress.country}</div>
                {order.shippingAddress.phone && (
                  <div className="pt-2">{order.shippingAddress.phone}</div>
                )}
              </div>
              {/* Tracking info if available */}
              {order.trackingNumber && (
                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: c.subtle }}
                >
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: c.earth500, fontFamily: fonts.body }}
                  >
                    Tracking
                  </div>
                  <div
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: c.subtle,
                      color: c.earth700,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {order.carrier && `${order.carrier} — `}
                    {order.trackingNumber}
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1 block hover:underline"
                      style={{ color: c.primary500 }}
                    >
                      Track Shipment →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Info Card */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: c.card,
              border: `1px solid ${c.subtle}`,
              boxShadow: c.shadow,
            }}
          >
            <div className="h-1" style={{ background: c.gradient }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: c.primary50 }}>
                  <CreditCard className="w-5 h-5" style={{ color: c.primary500 }} />
                </div>
                <h3
                  className="font-bold"
                  style={{ color: c.earth700, fontFamily: fonts.heading }}
                >
                  Payment Info
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
                    Method
                  </span>
                  <span
                    className="text-sm font-medium capitalize"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    {order.payment.method}
                  </span>
                </div>
                {order.payment.transactionId && (
                  <div>
                    <div
                      className="text-xs mb-1"
                      style={{ color: c.earth500, fontFamily: fonts.body }}
                    >
                      Transaction ID
                    </div>
                    <div
                      className="text-xs px-2 py-1 rounded break-all"
                      style={{
                        backgroundColor: c.subtle,
                        color: c.earth700,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {order.payment.transactionId}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
                    Status
                  </span>
                  <PaymentStatusBadge status={order.payment.status} />
                </div>
                <div
                  className="flex items-center justify-between pt-2 border-t"
                  style={{ borderColor: c.subtle }}
                >
                  <span className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
                    Amount
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: c.primary500, fontFamily: fonts.body }}
                  >
                    {formatCurrency(order.payment.amount, order.currency)}
                  </span>
                </div>
                {order.payment.paidAt && (
                  <div className="text-xs" style={{ color: c.earth500, fontFamily: fonts.body }}>
                    Paid on {formatDate(order.payment.paidAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Internal Notes Card */}
          {onAddNote && (
            <div
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: c.card,
                border: `1px solid ${c.subtle}`,
                boxShadow: c.shadow,
              }}
            >
              <div className="h-1" style={{ background: c.gradient }} />
              <div className="p-6">
                <h3
                  className="font-bold mb-4"
                  style={{ color: c.earth700, fontFamily: fonts.heading }}
                >
                  Internal Notes
                </h3>
                {order.notes.length > 0 ? (
                  <div className="mb-4">
                    {order.notes.map((note) => (
                      <NoteItem key={note.id} note={note} />
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-sm mb-4 px-4 py-3 rounded"
                    style={{
                      color: c.earth400,
                      backgroundColor: c.subtle,
                      fontFamily: fonts.body,
                    }}
                  >
                    No notes yet
                  </div>
                )}
                <div className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border resize-none transition-colors focus:outline-none"
                    style={{
                      borderColor: c.subtle,
                      color: c.earth700,
                      fontFamily: fonts.body,
                      backgroundColor: c.card,
                    }}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || isSavingNote}
                    className="w-full px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{
                      backgroundColor: c.primary500,
                      color: "white",
                      fontFamily: fonts.body,
                    }}
                  >
                    {isSavingNote ? "Saving…" : "Add Note"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
