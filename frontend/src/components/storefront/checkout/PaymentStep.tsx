"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard, Banknote, Shield, ArrowLeft, Package, MapPin, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/providers/cart-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

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

/** Dynamically load the Stripe.js script (idempotent). */
function loadStripeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if ((window as any).Stripe) return resolve(true)
    const script = document.createElement("script")
    script.src = "https://js.stripe.com/v3/"
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Format a price value (already in major units) for the given currency. */
function formatPrice(amount: number, currency: string): string {
  if (currency === "usd") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

export function PaymentStep() {
  const router = useRouter()
  const { cart } = useCart()
  const {
    contactEmail,
    paymentMethod,
    setPaymentMethod,
    razorpayKeyId,
    stripePublishableKey,
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

  const currency = (cart as any)?.currency_code || "inr"
  const isInternational = currency !== "inr"

  const RAZORPAY_KEY = razorpayKeyId || ""
  // Razorpay and COD are India-only
  const showRazorpay = !isInternational && Boolean(RAZORPAY_KEY)
  const showCod = !isInternational && codEnabled
  // Stripe is for international carts only
  const showStripe = isInternational && Boolean(stripePublishableKey)

  const [localError, setLocalError] = useState<string | null>(null)
  const [rzpLoading, setRzpLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  // Stripe state
  const stripeRef = useRef<any>(null)
  const stripeElementsRef = useRef<any>(null)
  const cardElementRef = useRef<any>(null)
  const cardContainerRef = useRef<HTMLDivElement>(null)
  const [stripeReady, setStripeReady] = useState(false)

  const rzpRef = useRef<any>(null)

  useEffect(() => {
    setError(null)
    initPayment()
  }, [])

  // Set default payment method selection
  useEffect(() => {
    if (paymentMethod === "system" || !paymentMethod) {
      if (showStripe) setPaymentMethod("stripe")
      else if (showRazorpay) setPaymentMethod("razorpay")
      else if (showCod) setPaymentMethod("cod")
    }
  }, [showStripe, showRazorpay, showCod])

  // Mount Stripe Card Element when Stripe is available and selected
  useEffect(() => {
    if (!showStripe || !stripePublishableKey || paymentMethod !== "stripe") return
    let mounted = true

    const setupStripe = async () => {
      const loaded = await loadStripeScript()
      if (!loaded || !mounted || !cardContainerRef.current) return

      // Reuse existing instance if already created
      if (!stripeRef.current) {
        stripeRef.current = (window as any).Stripe(stripePublishableKey)
      }
      if (!stripeElementsRef.current) {
        stripeElementsRef.current = stripeRef.current.elements()
      }
      // Destroy existing card element before re-mounting (avoids duplicate mount errors)
      if (cardElementRef.current) {
        cardElementRef.current.destroy()
        cardElementRef.current = null
      }
      const card = stripeElementsRef.current.create("card", {
        style: {
          base: {
            fontSize: "15px",
            color: "#433b35",
            fontFamily: "'Open Sans', sans-serif",
            "::placeholder": { color: "#a39585" },
          },
          invalid: { color: "#EF4444" },
        },
        hidePostalCode: true,
      })
      card.mount(cardContainerRef.current)
      cardElementRef.current = card
      if (mounted) setStripeReady(true)
    }

    setupStripe()
    return () => {
      mounted = false
    }
  }, [showStripe, stripePublishableKey, paymentMethod])

  const items = cart?.items || []
  // Cart totals are in minor units (paise / cents) — divide by 100 for display
  const subtotal = (cart?.subtotal || 0) / 100
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmount = (cart?.tax_total || 0) / 100
  const discountTotal = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const shippingAddr = cart?.shipping_address
  const selectedOption = shippingOptions.find((o) => o.id === selectedShippingId)

  const handleRazorpayPayment = async () => {
    setLocalError(null)
    setError(null)
    setRzpLoading(true)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load Razorpay. Please check your internet connection.")

      // Create the Razorpay order via our store API (which has access to store.metadata keys)
      const createRes = await fetch(`${BACKEND_URL}/store/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUB_KEY,
        },
        body: JSON.stringify({
          amount: (cart?.total || 0) / 100,  // paise → rupees (route expects rupees)
          currency: "INR",
        }),
      })
      const createData = await createRes.json()
      if (!createRes.ok || !createData.order_id) {
        throw new Error(createData.error || "Failed to initialize payment. Please try again.")
      }

      const { order_id: orderId, key_id: liveKeyId } = createData

      return new Promise<void>((resolve, reject) => {
        const options = {
          key: liveKeyId || RAZORPAY_KEY,
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

  const handleStripePayment = async () => {
    setLocalError(null)
    setError(null)
    setStripeLoading(true)

    try {
      if (!stripeRef.current || !cardElementRef.current) {
        throw new Error("Payment form not ready. Please wait and try again.")
      }

      // Create a PaymentIntent on the backend (reads Stripe secret from store.metadata)
      const intentRes = await fetch(`${BACKEND_URL}/store/stripe/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PUB_KEY,
        },
        body: JSON.stringify({
          amount: (cart?.total || 0) / 100, // cents → dollars (route expects major units)
          currency: "USD",
        }),
      })
      const intentData = await intentRes.json()
      if (!intentRes.ok || !intentData.client_secret) {
        throw new Error(intentData.error || "Failed to initialize payment. Please try again.")
      }

      // Confirm the card payment using Stripe.js
      const { error: stripeError } = await stripeRef.current.confirmCardPayment(
        intentData.client_secret,
        {
          payment_method: {
            card: cardElementRef.current,
            billing_details: {
              name: [shippingAddr?.first_name, shippingAddr?.last_name].filter(Boolean).join(" "),
              email: contactEmail,
              address: {
                line1: shippingAddr?.address_1 || "",
                city: shippingAddr?.city || "",
                postal_code: shippingAddr?.postal_code || "",
                country: shippingAddr?.country_code || "",
              },
            },
          },
        }
      )

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed. Please try again.")
      }

      // Stripe payment confirmed — complete the Medusa order
      const { orderId: medusaOrderId } = await completeCheckout()
      router.push(`/order-confirmation/${medusaOrderId}?clear=1`)
    } catch (err: any) {
      setLocalError(err?.message || "Payment failed. Please try again.")
    } finally {
      setStripeLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    setLocalError(null)
    setError(null)

    if (paymentMethod === "stripe") {
      await handleStripePayment()
      return
    }

    if (paymentMethod === "razorpay") {
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

  const noPaymentConfigured = !showRazorpay && !showCod && !showStripe
  const anyLoading = isProcessing || rzpLoading || stripeLoading

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
                  {formatPrice((item.unit_price || 0) / 100 * item.quantity, currency)}
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

      {/* Payment method selection */}
      <div>
        <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: earth[500] }}>Payment Method</p>
        <div className="space-y-2">

          {/* Stripe — international (USD) customers */}
          {showStripe && (
            <label
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${paymentMethod === "stripe" ? primary[500] : "#e8e0d8"}`,
                background: paymentMethod === "stripe" ? primary[50] : bg.card,
              }}
            >
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                style={{ accentColor: primary[500], marginTop: 2 }}
              />
              <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: paymentMethod === "stripe" ? primary[500] : earth[400] }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: earth[700] }}>Card Payment</p>
                <p className="text-xs mb-3" style={{ color: earth[400] }}>Credit or debit card — secured by Stripe</p>
                {/* Stripe card element container — only visible when this method is selected */}
                {paymentMethod === "stripe" && (
                  <div
                    ref={cardContainerRef}
                    className="p-3 rounded-lg"
                    style={{ background: "#fff", border: "1px solid #e8e0d8" }}
                  />
                )}
              </div>
            </label>
          )}

          {/* Razorpay — India (INR) customers */}
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

          {/* Cash on Delivery — India only */}
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
          ...(taxAmount > 0 ? [{ label: "Tax", value: taxAmount }] : []),
          ...(discountTotal > 0 ? [{ label: "Discount", value: -discountTotal, green: true }] : []),
        ].map(({ label, value, green }: any) => (
          <div key={label} className="flex justify-between text-sm">
            <span style={{ color: earth[500] }}>{label}</span>
            <span style={{ color: green ? "#10B981" : earth[600], fontWeight: green ? 600 : 400 }}>
              {green ? "-" : ""}{formatPrice(Math.abs(value), currency)}
            </span>
          </div>
        ))}
        <div className="pt-2 flex justify-between font-bold text-base" style={{ borderTop: "1px solid #e8e0d8" }}>
          <span style={{ color: earth[700] }}>Total</span>
          <span style={{ color: primary[500] }}>{formatPrice(grandTotal, currency)}</span>
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
          disabled={anyLoading || noPaymentConfigured || (paymentMethod === "stripe" && !stripeReady && showStripe)}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
        >
          {anyLoading
            ? (rzpLoading ? "Opening Payment..." : stripeLoading ? "Processing..." : "Placing Order...")
            : paymentMethod === "cod"
              ? `Place Order · ₹${grandTotal.toLocaleString("en-IN")} (COD)`
              : `Pay ${formatPrice(grandTotal, currency)}`}
        </button>
      </div>
    </div>
  )
}
