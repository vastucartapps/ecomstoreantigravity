"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Package, MapPin, Download, Loader2, CheckCircle2, Circle, Truck, Clock } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"
import type { Order } from "@/types/dashboard"
import type { InvoiceData, InvoiceItem } from "@/lib/invoice-generator"
import { DEFAULT_HSN } from "@/lib/gst-utils"

interface OrderDetailProps {
  orderId: string
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  processing: "#3B82F6",
  confirmed: "#8B5CF6",
  shipped: "#F59E0B",
  delivered: "#10B981",
  cancelled: "#EF4444",
  refunded: "#6B7280",
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const { fetchOrders } = useDashboardData()
  const [order, setOrder] = useState<Order | null>(null)
  const [rawOrder, setRawOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    if (!orderId) return
    loadOrder()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const { medusa } = await import("@/lib/medusa")
      const result = await medusa.store.order.retrieve(orderId)
      const raw = (result as any).order || result
      setRawOrder(raw)
      // Convert to dashboard Order type
      const orders = await fetchOrders(100)
      const found = orders.find((o) => o.id === orderId)
      setOrder(found || null)
    } catch {
      setOrder(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    if (!rawOrder) return
    setDownloadingPdf(true)
    try {
      const { generateGSTInvoicePDF } = await import("@/lib/invoice-generator")
      const addr = rawOrder.shipping_address || {}
      const invoiceItems: InvoiceItem[] = (rawOrder.items || []).map((item: any) => ({
        name: item.product_title || item.title || "Product",
        hsn: item.variant?.product?.metadata?.hsn_code || DEFAULT_HSN,
        quantity: item.quantity,
        rate: (item.unit_price || 0) / 100,
        gstRate: item.variant?.product?.metadata?.gst_rate ?? 18,
        buyerState: addr.province,
      }))
      const invoiceData: InvoiceData = {
        orderId: rawOrder.id || orderId,
        orderDate: new Date(rawOrder.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        }),
        customerName: [addr.first_name, addr.last_name].filter(Boolean).join(" ") || "Customer",
        customerEmail: rawOrder.email || "",
        shippingAddress: {
          address1: addr.address_1 || "",
          address2: addr.address_2 || "",
          city: addr.city || "",
          state: addr.province || "",
          postalCode: addr.postal_code || "",
          country: addr.country_code?.toUpperCase() || "IN",
          phone: addr.phone || "",
        },
        items: invoiceItems,
        shippingCharge: (rawOrder.shipping_total || 0) / 100,
        currency: rawOrder.currency_code || "inr",
      }
      await generateGSTInvoicePDF(invoiceData)
    } catch (e) {
      console.error("Invoice error:", e)
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: primary[500] }} />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
        <p className="text-sm" style={{ color: earth[500] }}>Order not found</p>
        <Link href="/account/orders" className="text-sm mt-2 inline-block" style={{ color: primary[500] }}>
          ← Back to orders
        </Link>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[order.status] || "#3B82F6"

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-70 transition-opacity" style={{ color: primary[500] }}>
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
              {order.orderNumber}
            </h1>
            <p className="text-sm" style={{ color: earth[400] }}>
              Placed on {order.orderDate}
            </p>
          </div>
          <span
            className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: `${statusColor}18`, color: statusColor }}
          >
            {STATUS_LABELS[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: earth[700] }}>Order Timeline</h2>
        <div className="relative">
          {order.timeline.map((step, idx) => {
            const isLast = idx === order.timeline.length - 1
            return (
              <div key={step.label} className="flex gap-3">
                {/* Icon column */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.completed ? primary[500] : step.current ? `${primary[500]}20` : "#f0ebe4",
                    }}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : step.current ? (
                      <Clock className="w-3.5 h-3.5" style={{ color: primary[500] }} />
                    ) : (
                      <Circle className="w-3.5 h-3.5" style={{ color: earth[300] }} />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className="w-0.5 flex-1 my-1"
                      style={{ background: step.completed ? primary[300] : "#e8e0d8", minHeight: "24px" }}
                    />
                  )}
                </div>
                {/* Text */}
                <div className="pb-4">
                  <p
                    className="text-sm font-medium"
                    style={{ color: step.completed ? earth[700] : step.current ? primary[500] : earth[300] }}
                  >
                    {step.label}
                    {step.current && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: `${primary[500]}15`, color: primary[500] }}>
                        Current
                      </span>
                    )}
                  </p>
                  {step.date && (
                    <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{step.date}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {order.trackingNumber && (
          <div className="mt-3 p-3 rounded-lg flex items-center gap-2" style={{ background: "#f0ebe4" }}>
            <Truck className="w-4 h-4 flex-shrink-0" style={{ color: primary[500] }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: earth[700] }}>Tracking Number</p>
              <p className="text-xs font-mono" style={{ color: primary[500] }}>{order.trackingNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid #f0ebe4", background: bg.card }}>
          <Package className="w-4 h-4" style={{ color: primary[500] }} />
          <p className="text-sm font-semibold" style={{ color: earth[700] }}>
            {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ background: bg.card }}>
          {order.items.map((item, idx) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: idx < order.items.length - 1 ? "1px solid #f0ebe4" : "none" }}
            >
              {item.thumbnail ? (
                <img src={normalizeImageUrl(item.thumbnail)} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid #f0ebe4" }} />
              ) : (
                <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: "#f0ebe4" }} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: earth[700] }}>{item.productTitle}</p>
                {item.variantTitle && <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{item.variantTitle}</p>}
                <p className="text-xs mt-0.5" style={{ color: earth[400] }}>Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold flex-shrink-0" style={{ color: earth[700] }}>
                ₹{item.total.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
          <div className="px-5 py-3.5 flex justify-between" style={{ borderTop: "1px solid #f0ebe4", background: "#f9f6f2" }}>
            <span className="text-sm font-semibold" style={{ color: earth[700] }}>Total</span>
            <span className="text-base font-bold" style={{ color: primary[500] }}>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      {order.shippingAddress && (
        <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: primary[500] }} />
            <p className="text-sm font-semibold" style={{ color: earth[700] }}>Delivery Address</p>
          </div>
          <p className="text-sm" style={{ color: earth[500] }}>{order.shippingAddress}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownloadInvoice}
          disabled={downloadingPdf || !rawOrder}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ border: `1.5px solid ${primary[500]}`, color: primary[500], background: bg.card }}
        >
          {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloadingPdf ? "Generating..." : "Download Invoice"}
        </button>
      </div>
    </div>
  )
}
