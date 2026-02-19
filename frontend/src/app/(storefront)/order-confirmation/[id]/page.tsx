"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2, Package, MapPin, Download, ShoppingBag, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { medusa } from "@/lib/medusa"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"
import type { InvoiceData, InvoiceItem } from "@/lib/invoice-generator"
import { DEFAULT_HSN } from "@/lib/gst-utils"

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])

  useEffect(() => {
    if (!orderId || orderId === "unknown") {
      setIsLoading(false)
      return
    }
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const result = await medusa.store.order.retrieve(orderId)
      setOrder((result as any).order || result)
      // Fetch related products from same category as first item
      fetchRelated((result as any).order || result)
    } catch {
      // Order fetch failed (token may not be set for guest). Try without auth.
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""}/store/orders/${orderId}`,
          {
            headers: {
              "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
          }
        )
        const data = await res.json()
        setOrder(data.order || data)
        fetchRelated(data.order || data)
      } catch {
        // Can't fetch order
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRelated = async (orderData: any) => {
    try {
      const firstItem = orderData?.items?.[0]
      const categoryId = firstItem?.variant?.product?.categories?.[0]?.id
      if (!categoryId) return
      const result = await medusa.store.product.list({ category_id: [categoryId], limit: 4 })
      setRelatedProducts((result as any).products?.slice(0, 4) || [])
    } catch {}
  }

  const handleDownloadInvoice = async () => {
    if (!order) return
    setDownloadingPdf(true)
    try {
      const { generateGSTInvoicePDF } = await import("@/lib/invoice-generator")
      const addr = order.shipping_address || {}
      const invoiceItems: InvoiceItem[] = (order.items || []).map((item: any) => ({
        name: item.product_title || item.title || "Product",
        hsn: item.variant?.product?.metadata?.hsn_code || DEFAULT_HSN,
        quantity: item.quantity,
        rate: (item.unit_price || 0) / 100,
        gstRate: item.variant?.product?.metadata?.gst_rate ?? 18,
        buyerState: addr.province,
      }))
      const invoiceData: InvoiceData = {
        orderId: order.id || orderId,
        orderDate: new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        }),
        customerName: [addr.first_name, addr.last_name].filter(Boolean).join(" ") || "Customer",
        customerEmail: order.email || "",
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
        shippingCharge: (order.shipping_total || 0) / 100,
        currency: order.currency_code || "inr",
      }
      await generateGSTInvoicePDF(invoiceData)
    } catch (e) {
      console.error("Invoice generation failed:", e)
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: bg.primary }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primary[500] }} />
      </div>
    )
  }

  const orderItems = order?.items || []
  const grandTotal = (order?.total || 0) / 100
  const addr = order?.shipping_address

  return (
    <div className="min-h-screen" style={{ background: bg.primary }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Success banner */}
        <div
          className="text-center rounded-3xl p-8 mb-6"
          style={{ background: `linear-gradient(135deg, ${primary[500]}18, ${primary[50]})`, border: `1px solid ${primary[100]}` }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: earth[700], fontFamily: fonts.heading }}>
            Order Placed Successfully!
          </h1>
          <p className="text-sm mb-3" style={{ color: earth[400] }}>
            Thank you for shopping with VastuCart. You'll receive a confirmation email shortly.
          </p>
          {order?.id && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ background: bg.card }}>
              <span style={{ color: earth[500] }}>Order ID:</span>
              <span className="font-mono font-semibold" style={{ color: earth[700] }}>
                {order.id.replace("order_", "").slice(-12).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Order items */}
        {orderItems.length > 0 && (
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid #f0ebe4" }}>
              <Package className="w-4 h-4" style={{ color: primary[500] }} />
              <p className="text-sm font-semibold" style={{ color: earth[700] }}>
                {orderItems.length} item{orderItems.length > 1 ? "s" : ""} ordered
              </p>
            </div>
            <div className="divide-y" style={{ borderColor: "#f0ebe4" }}>
              {orderItems.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                  {item.thumbnail ? (
                    <img src={normalizeImageUrl(item.thumbnail)} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: "1px solid #f0ebe4" }} />
                  ) : (
                    <div className="w-14 h-14 rounded-xl flex-shrink-0" style={{ background: "#f0ebe4" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: earth[700] }}>
                      {item.product_title || item.title}
                    </p>
                    {item.variant_title && (
                      <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{item.variant_title}</p>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: earth[400] }}>Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold flex-shrink-0" style={{ color: earth[700] }}>
                    ₹{((item.unit_price || 0) / 100 * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            {/* Totals row */}
            <div className="px-5 py-3.5 flex justify-between" style={{ borderTop: "1px solid #f0ebe4", background: "#f9f6f2" }}>
              <span className="text-sm font-semibold" style={{ color: earth[700] }}>Total Paid</span>
              <span className="text-base font-bold" style={{ color: primary[500] }}>
                ₹{grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Delivery address */}
        {addr && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" style={{ color: primary[500] }} />
              <p className="text-sm font-semibold" style={{ color: earth[700] }}>Delivery Address</p>
            </div>
            <p className="text-sm font-medium" style={{ color: earth[600] }}>
              {[addr.first_name, addr.last_name].filter(Boolean).join(" ")}
            </p>
            <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
              {[addr.address_1, addr.address_2, addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ")}
            </p>
            {addr.phone && <p className="text-sm mt-0.5" style={{ color: earth[400] }}>{addr.phone}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <button
            onClick={handleDownloadInvoice}
            disabled={downloadingPdf || !order}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ border: `1.5px solid ${primary[500]}`, color: primary[500], background: bg.card }}
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {downloadingPdf ? "Generating PDF..." : "Download GST Invoice"}
          </button>

          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
          >
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* You may also like */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold" style={{ color: earth[700], fontFamily: fonts.heading }}>
                You May Also Like
              </h2>
              <Link href="/" className="flex items-center text-xs font-medium" style={{ color: primary[500] }}>
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedProducts.map((product: any) => {
                const thumbnail = product.thumbnail || product.images?.[0]?.url
                const price = product.variants?.[0]?.calculated_price?.calculated_amount || 0
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.handle}`}
                    className="rounded-xl overflow-hidden transition-shadow hover:shadow-md"
                    style={{ background: bg.card, border: "1px solid #f0ebe4" }}
                  >
                    <div className="aspect-square overflow-hidden" style={{ background: "#f9f6f2" }}>
                      {thumbnail ? (
                        <img src={thumbnail} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8" style={{ color: earth[200] }} />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-medium truncate" style={{ color: earth[700] }}>{product.title}</p>
                      {price > 0 && (
                        <p className="text-xs font-bold mt-0.5" style={{ color: primary[500] }}>
                          ₹{(price / 100).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
