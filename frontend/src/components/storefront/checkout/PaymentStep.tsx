"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard, Banknote, Shield, ArrowLeft, Package, MapPin, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/providers/cart-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"


/** Dynamically load the Razorpay checkout.js script (idempotent). */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if ((window as any).Razorpay) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function PaymentStep() {
  const router = useRouter()
  const { cart } = useCart()
  const {
    contactEmail,
    paymentMethod,
    setPaymentMethod,
    razorpayKeyId,
    codEnabled,
    codConfig,
    shippingOptions,
    selectedShippingId,
    initPayment,
    completeCheckout,
    goBack,
    isProcessing,
    error,
    setError,
  } = useCheckout()

  const RAZORPAY_KEY = razorpayKeyId || ""
  const showRazorpay = Boolean(RAZORPAY_KEY)
  const showCod = codEnabled

  const [localError, setLocalError] = useState<string | null>(null)
  const [rzpLoading, setRzpLoading] = useState(false)
  const rzpRef = useRef<any>(null)

  useEffect(() => {
    setError(null)
    initPayment()
  }, [])

  // Set default selection: Razorpay if key configured, else COD if enabled
  useEffect(() => {
    if (paymentMethod === "system" || !paymentMethod) {
      if (showRazorpay) setPaymentMethod("razorpay")
      else if (showCod) setPaymentMethod("cod")
    }
  }, [showRazorpay, showCod])

  const items = cart?.items || []
  const subtotal = (cart?.subtotal || 0) / 100
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmount = (cart?.tax_total || 0) / 100
  const discountTotal = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const shippingAddr = cart?.shipping_address
  const selectedOption = shippingOptions.find((o) => o.id === selectedShippingId)

  const razorpaySession = (() => {
    const sessions = (cart as any)?.payment_collection?.payment_sessions || []
    return sessions.find(
      (s: any) => s.provider_id?.includes("razorpay") && s.status !== "canceled"
    ) || null
  })()

  const handleRazorpayPayment = async () => {
    setLocalError(null)
    setError(null)
    setRzpLoading(true)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load Razorpay. Please check your internet connection.")

      const orderId = razorpaySession?.data?.id
      if (!orderId) throw new Error("Razorpay order not initialized. Please refresh and try again.")

      return new Promise<void>((resolve, reject) => {
        const options = {
          key: RAZORPAY_KEY,
          amount: cart?.total || 0,        // in paise
          currency: "INR",
          order_id: orderId,
          name: "VastuCart",
          description: "Order Payment",
          prefill: {
            name: [shippingAddr?.first_name, shippingAddr?.last_name].filter(Boolean).join(" "),
            email: contactEmail,
            contact: shippingAddr?.phone || "",
          },
          theme: { color: primary[500] },
          handler: async (_response: any) => {
            try {
              const { orderId: medusaOrderId } = await completeCheckout()
              router.push(`/order-confirmation/${medusaOrderId}?clear=1`)
              resolve()
            } catch (err: any) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled. Your cart is safe — try again when ready."))
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzpRef.current = rzp
        rzp.on("payment.failed", (response: any) => {
          reject(new Error(response?.error?.description || "Payment failed. Please try again."))
        })
        rzp.open()
      })
    } catch (err: any) {
      setLocalError(err?.message || "Payment failed. Please try again.")
    } finally {
      setRzpLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    setLocalError(null)
    setError(null)

    if (paymentMethod === "razorpay") {
      if (!RAZORPAY_KEY) {
        setLocalError("Razorpay is not configured. Go to Admin → Payments and add your keys.")
        return
      }
      if (!razorpaySession) {
        setLocalError("Payment session not ready. Please wait a moment and try again.")
        return
      }
      await handleRazorpayPayment()
      return
    }

    if (paymentMethod === "cod") {
      // Validate against admin COD rules
      if (codConfig) {
        if (codConfig.minOrder > 0 && grandTotal < codConfig.minOrder) {
          setLocalError(`COD requires a minimum order of ₹${codConfig.minOrder.toLocaleString("en-IN")}. Your order is ₹${grandTotal.toLocaleString("en-IN")}.`)
          return
        }
        if (codConfig.maxOrder < Infinity && grandTotal > codConfig.maxOrder) {
          setLocalError(`COD is not available for orders above ₹${codConfig.maxOrder.toLocaleString("en-IN")}. Please pay online.`)
          return
        }
      }
      try {
        const { orderId } = await completeCheckout()
        router.push(`/order-confirmation/${orderId}?clear=1`)
      } catch (err: any) {
        setLocalError(err?.message || "Failed to place order. Please try again.")
      }
      return
    }

    setLocalError("Please select a payment method.")
  }

  const displayError = localError || error

  const formatAddr = () => {
    if (!shippingAddr) return "No address selected"
    return [shippingAddr.address_1, shippingAddr.city, shippingAddr.province, shippingAddr.postal_code]
      .filter(Boolean)
      .join(", ")
  }

  const noPaymentConfigured = !showRazorpay && !showCod

  return (
    <div className="space-y-5">
      {/* Order review */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        <div className="px-4 py-3" style={{ background: "#f9f6f2" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: earth[500] }}>Order Review</p>
        </div>
        <div className="divide-y" style={{ borderColor: "#f0ebe4" }}>
          {items.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.thumbnail ? (
                <img
                  src={normalizeImageUrl(item.thumbnail)}
                  alt={item.product_title || ""}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  style={{ border: "1px solid #f0ebe4" }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "#f0ebe4" }}>
                  <Package className="w-5 h-5" style={{ color: earth[300] }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: earth[700] }}>
                  {item.product_title || item.title}
                </p>
                {item.variant_title && (
                  <p className="text-xs" style={{ color: earth[400] }}>{item.variant_title}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold" style={{ color: earth[700] }}>
                  ₹{((item.unit_price || 0) / 100 * item.quantity).toLocaleString("en-IN")}
                </p>
                <p className="text-xs" style={{ color: earth[400] }}>× {item.quantity}</p>
              </div>
            </div>
          ))}
          {items.length > 3 && (
            <div className="px-4 py-2">
              <p className="text-xs" style={{ color: earth[400] }}>+{items.length - 3} more item{items.length - 3 > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl" style={{ background: "#f9f6f2", border: "1px solid #f0ebe4" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <MapPin className="w-3.5 h-3.5" style={{ color: primary[500] }} />
            <p className="text-xs font-semibold" style={{ color: earth[600] }}>Deliver to</p>
          </div>
          <p className="text-xs" style={{ color: earth[500] }}>{formatAddr()}</p>
        </div>
        <div className="p-3.5 rounded-xl" style={{ background: "#f9f6f2", border: "1px solid #f0ebe4" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Truck className="w-3.5 h-3.5" style={{ color: primary[500] }} />
            <p className="text-xs font-semibold" style={{ color: earth[600] }}>Shipping</p>
          </div>
          <p className="text-xs" style={{ color: earth[500] }}>
            {selectedOption?.name || "Standard Shipping"}
          </p>
        </div>
      </div>

      {/* Payment method — radio selection between what admin has configured */}
      <div>
        <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: earth[500] }}>Payment Method</p>
        <div className="space-y-2">

          {/* Online Payment via Razorpay */}
          {showRazorpay && (
            <label
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${paymentMethod === "razorpay" ? primary[500] : "#e8e0d8"}`,
                background: paymentMethod === "razorpay" ? primary[50] : bg.card,
              }}
            >
              <input
                type="radio"
                name="payment"
                value="razorpay"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                style={{ accentColor: primary[500] }}
              />
              <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: paymentMethod === "razorpay" ? primary[500] : earth[400] }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: earth[700] }}>Online Payment</p>
                <p className="text-xs" style={{ color: earth[400] }}>UPI · Credit/Debit Card · Net Banking via Razorpay</p>
              </div>
            </label>
          )}

          {/* Cash on Delivery */}
          {showCod && (
            <label
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${paymentMethod === "cod" ? primary[500] : "#e8e0d8"}`,
                background: paymentMethod === "cod" ? primary[50] : bg.card,
              }}
            >
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                style={{ accentColor: primary[500] }}
              />
              <Banknote className="w-4 h-4 flex-shrink-0" style={{ color: paymentMethod === "cod" ? primary[500] : earth[400] }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: earth[700] }}>
                  Cash on Delivery
                  {codConfig?.fee && codConfig.fee > 0 ? ` (+₹${codConfig.fee} fee)` : ""}
                </p>
                <p className="text-xs" style={{ color: earth[400] }}>
                  Pay ₹{(grandTotal + (codConfig?.fee || 0)).toLocaleString("en-IN")} when your order arrives
                  {codConfig?.minOrder && codConfig.minOrder > 0
                    ? ` · Min order ₹${codConfig.minOrder.toLocaleString("en-IN")}`
                    : ""}
                  {codConfig?.maxOrder && codConfig.maxOrder < Infinity
                    ? ` · Max ₹${codConfig.maxOrder.toLocaleString("en-IN")}`
                    : ""}
                </p>
              </div>
            </label>
          )}

          {/* No payment method configured */}
          {noPaymentConfigured && (
            <div className="p-4 rounded-xl" style={{ background: "#FEF3C7", border: "1px solid #FDE68A" }}>
              <p className="text-sm" style={{ color: "#92400E" }}>
                No payment method configured. Please contact support.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Price breakdown */}
      <div className="rounded-xl p-4 space-y-2" style={{ background: "#f9f6f2", border: "1px solid #f0ebe4" }}>
        {[
          { label: "Subtotal", value: subtotal },
          ...(shippingFee > 0 ? [{ label: "Shipping", value: shippingFee }] : []),
          ...(taxAmount > 0 ? [{ label: "GST", value: taxAmount }] : []),
          ...(discountTotal > 0 ? [{ label: "Discount", value: -discountTotal, green: true }] : []),
        ].map(({ label, value, green }: any) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: earth[500] }}>{label}</span>
            <span style={{ color: green ? "#10B981" : earth[600], fontWeight: green ? 600 : 400 }}>
              {green ? "-" : ""}₹{Math.abs(value).toLocaleString("en-IN")}
            </span>
          </div>
        ))}
        <div className="pt-2 flex justify-between font-bold text-base" style={{ borderTop: "1px solid #e8e0d8" }}>
          <span style={{ color: earth[700] }}>Total</span>
          <span style={{ color: primary[500] }}>₹{grandTotal.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <Shield className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
        <p className="text-xs" style={{ color: "#065F46" }}>
          Your payment information is encrypted and secure. We never store card details.
        </p>
      </div>

      {displayError && (
        <p className="text-sm px-4 py-2.5 rounded-lg" style={{ color: "#EF4444", background: "#FEF2F2" }}>
          {displayError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={goBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
          style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing || rzpLoading || noPaymentConfigured}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
        >
          {isProcessing || rzpLoading
            ? (rzpLoading ? "Opening Payment..." : "Placing Order...")
            : paymentMethod === "cod"
              ? `Place Order · ₹${grandTotal.toLocaleString("en-IN")} (COD)`
              : `Pay ₹${grandTotal.toLocaleString("en-IN")}`}
        </button>
      </div>
    </div>
  )
}
