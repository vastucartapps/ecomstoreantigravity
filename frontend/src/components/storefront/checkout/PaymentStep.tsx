"use client"

import { useEffect, useRef, useState } from "react"
import {
  CreditCard, Banknote, Shield, ArrowLeft, Package, MapPin, Truck,
  Eye, EyeOff, ChevronDown, Smartphone, Building2, Wallet,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/providers/cart-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// ─── Script loaders ───────────────────────────────────────────────────────────

let _rzpScriptLoaded = false

/**
 * Loads razorpay.js (Custom Checkout SDK — supports both createPayment() and rzp.open()).
 * Falls back to checkout.js if razorpay.js fails.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if (_rzpScriptLoaded && (window as any).Razorpay) return resolve(true)
    const tryLoad = (src: string, next?: () => void) => {
      const s = document.createElement("script")
      s.src = src
      s.onload = () => { _rzpScriptLoaded = true; resolve(true) }
      s.onerror = () => { if (next) next(); else resolve(false) }
      document.body.appendChild(s)
    }
    tryLoad(
      "https://checkout.razorpay.com/v1/razorpay.js",
      () => tryLoad("https://checkout.razorpay.com/v1/checkout.js"),
    )
  })
}

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string): string {
  if (currency === "usd") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `₹${amount.toLocaleString("en-IN")}`
}

function luhnCheck(num: string): boolean {
  const digits = num.replace(/\D/g, "")
  if (digits.length < 13) return false
  let sum = 0
  let isEven = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10)
    if (isEven) { d *= 2; if (d > 9) d -= 9 }
    sum += d
    isEven = !isEven
  }
  return sum % 10 === 0
}

function fmtCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(.{4})/g, "$1 ").trim()
}

function fmtExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length >= 2) return digits.slice(0, 2) + "/" + digits.slice(2)
  return digits
}

function getCardBrand(num: string): string {
  const n = num.replace(/\D/g, "")
  if (/^4/.test(n)) return "VISA"
  if (/^5[1-5]|^2[2-7]/.test(n)) return "MC"
  if (/^3[47]/.test(n)) return "AMEX"
  if (/^6[0-9]/.test(n)) return "RUPAY"
  return ""
}

const BANKS = [
  { code: "SBIN", name: "State Bank of India" },
  { code: "HDFC", name: "HDFC Bank" },
  { code: "ICIC", name: "ICICI Bank" },
  { code: "UTIB", name: "Axis Bank" },
  { code: "KKBK", name: "Kotak Mahindra Bank" },
  { code: "PUNB", name: "Punjab National Bank" },
  { code: "BARB", name: "Bank of Baroda" },
  { code: "CNRB", name: "Canara Bank" },
  { code: "UBIN", name: "Union Bank of India" },
  { code: "YESB", name: "Yes Bank" },
  { code: "INDB", name: "IndusInd Bank" },
  { code: "IBKL", name: "IDBI Bank" },
]

const WALLETS = [
  { id: "phonepe", name: "PhonePe" },
  { id: "paytm", name: "Paytm" },
  { id: "amazonpay", name: "Amazon Pay" },
  { id: "mobikwik", name: "MobiKwik" },
  { id: "freecharge", name: "Freecharge" },
  { id: "olamoney", name: "Ola Money" },
]

// ─── Component ────────────────────────────────────────────────────────────────

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
  const showRazorpay = !isInternational && Boolean(RAZORPAY_KEY)
  const showCod = !isInternational && codEnabled
  const showStripe = isInternational && Boolean(stripePublishableKey)

  const [localError, setLocalError] = useState<string | null>(null)
  const [rzpLoading, setRzpLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  // Razorpay inline tabs
  type RzpTab = "card" | "upi" | "netbanking" | "wallet"
  const [rzpTab, setRzpTab] = useState<RzpTab>("card")

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [showCvv, setShowCvv] = useState(false)

  // Net Banking + Wallet
  const [selectedBank, setSelectedBank] = useState("")
  const [selectedWallet, setSelectedWallet] = useState("")

  // Stripe
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

  useEffect(() => {
    if (paymentMethod === "system" || !paymentMethod) {
      if (showStripe) setPaymentMethod("stripe")
      else if (showRazorpay) setPaymentMethod("razorpay")
      else if (showCod) setPaymentMethod("cod")
    }
  }, [showStripe, showRazorpay, showCod])

  useEffect(() => {
    if (!showStripe || !stripePublishableKey || paymentMethod !== "stripe") return
    let mounted = true
    const setupStripe = async () => {
      const loaded = await loadStripeScript()
      if (!loaded || !mounted || !cardContainerRef.current) return
      if (!stripeRef.current) stripeRef.current = (window as any).Stripe(stripePublishableKey)
      if (!stripeElementsRef.current) stripeElementsRef.current = stripeRef.current.elements()
      if (cardElementRef.current) { cardElementRef.current.destroy(); cardElementRef.current = null }
      const card = stripeElementsRef.current.create("card", {
        style: {
          base: { fontSize: "15px", color: "#433b35", fontFamily: "'Open Sans', sans-serif", "::placeholder": { color: "#a39585" } },
          invalid: { color: "#EF4444" },
        },
        hidePostalCode: true,
      })
      card.mount(cardContainerRef.current)
      cardElementRef.current = card
      if (mounted) setStripeReady(true)
    }
    setupStripe()
    return () => { mounted = false }
  }, [showStripe, stripePublishableKey, paymentMethod])

  // Cart values
  const items = cart?.items || []
  const subtotal = (cart?.subtotal || 0) / 100
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmount = (cart?.tax_total || 0) / 100
  const discountTotal = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const shippingAddr = cart?.shipping_address
  const selectedOption = shippingOptions.find((o) => o.id === selectedShippingId)

  // Card validation
  const cardDigits = cardNumber.replace(/\D/g, "")
  const cardBrand = getCardBrand(cardNumber)
  const cardValid = cardDigits.length >= 13 && luhnCheck(cardDigits)
  const expiryValid = /^\d{2}\/\d{2}$/.test(cardExpiry) && (() => {
    const [mm, yy] = cardExpiry.split("/").map(Number)
    const now = new Date()
    const expYear = 2000 + yy
    return mm >= 1 && mm <= 12 &&
      (expYear > now.getFullYear() || (expYear === now.getFullYear() && mm - 1 >= now.getMonth()))
  })()
  const cvvValid = /^\d{3,4}$/.test(cardCvv)
  const nameValid = cardName.trim().length >= 2

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /** Custom Checkout for cards — no Razorpay popup, inline on our page */
  const handleRazorpayCardPayment = async (): Promise<void> => {
    if (!cardValid) { setLocalError("Please enter a valid card number."); return }
    if (!expiryValid) { setLocalError("Please enter a valid expiry date (MM/YY)."); return }
    if (!cvvValid) { setLocalError("Please enter a valid CVV."); return }
    if (!nameValid) { setLocalError("Please enter the cardholder name."); return }

    setLocalError(null)
    setError(null)
    setRzpLoading(true)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load payment module. Please check your internet connection.")

      const createRes = await fetch(`${BACKEND_URL}/store/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "INR" }),
      })
      const createData = await createRes.json()
      if (!createRes.ok || !createData.order_id) {
        throw new Error(createData.error || "Payment initialization failed. Please try again.")
      }
      const { order_id: orderId, key_id: liveKeyId } = createData

      return new Promise<void>((resolve, reject) => {
        const razorpay = new (window as any).Razorpay({ key: liveKeyId || RAZORPAY_KEY })
        rzpRef.current = razorpay

        razorpay.on("payment.success", async (_resp: any) => {
          try {
            const { orderId: medusaOrderId } = await completeCheckout()
            router.push(`/order-confirmation/${medusaOrderId}?clear=1`)
            resolve()
          } catch (err: any) { reject(err) }
        })

        razorpay.on("payment.error", (resp: any) => {
          reject(new Error(resp?.error?.description || "Card payment failed. Please check your details and try again."))
        })

        const [expMonth, expYear] = cardExpiry.split("/").map((s) => s.trim())

        // Custom Checkout: createPayment collects card data and processes securely
        if (typeof razorpay.createPayment === "function") {
          razorpay.createPayment({
            amount: cart?.total || 0,  // in paise
            currency: "INR",
            order_id: orderId,
            email: contactEmail,
            contact: shippingAddr?.phone || "",
            method: "card",
            "card[name]": cardName.trim(),
            "card[number]": cardDigits,
            "card[cvv]": cardCvv,
            "card[expiry_month]": expMonth,
            "card[expiry_year]": expYear,
          })
        } else {
          // Fallback: Standard Checkout pre-configured for card method
          const options = {
            key: liveKeyId || RAZORPAY_KEY,
            amount: cart?.total || 0,
            currency: "INR",
            order_id: orderId,
            name: "VastuCart",
            description: "Secure Card Payment",
            prefill: {
              name: cardName.trim(),
              email: contactEmail,
              contact: shippingAddr?.phone || "",
              method: "card",
            },
            config: {
              display: {
                blocks: { cards: { name: "Pay via Card", instruments: [{ method: "card" }] } },
                sequence: ["block.cards"],
                preferences: { show_default_blocks: false },
              },
            },
            theme: { color: primary[500] },
            handler: async (_response: any) => {
              try {
                const { orderId: medusaOrderId } = await completeCheckout()
                router.push(`/order-confirmation/${medusaOrderId}?clear=1`)
                resolve()
              } catch (err: any) { reject(err) }
            },
            modal: { ondismiss: () => reject(new Error("Payment cancelled. Your cart is safe.")) },
          }
          const rzp = new (window as any).Razorpay(options)
          rzp.on("payment.failed", (r: any) => reject(new Error(r?.error?.description || "Payment failed.")))
          rzp.open()
        }
      })
    } catch (err: any) {
      setLocalError(err?.message || "Payment failed. Please try again.")
    } finally {
      setRzpLoading(false)
    }
  }

  /** Standard Checkout pre-configured to show only UPI / Net Banking / Wallet */
  const handleRazorpayModalPayment = async (method: "upi" | "netbanking" | "wallet"): Promise<void> => {
    if (method === "netbanking" && !selectedBank) { setLocalError("Please select your bank."); return }
    if (method === "wallet" && !selectedWallet) { setLocalError("Please select a wallet."); return }

    setLocalError(null)
    setError(null)
    setRzpLoading(true)

    try {
      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error("Failed to load payment module.")

      const createRes = await fetch(`${BACKEND_URL}/store/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "INR" }),
      })
      const createData = await createRes.json()
      if (!createRes.ok || !createData.order_id) {
        throw new Error(createData.error || "Payment initialization failed. Please try again.")
      }
      const { order_id: orderId, key_id: liveKeyId } = createData

      return new Promise<void>((resolve, reject) => {
        const instrument: Record<string, any> = { method }
        if (method === "netbanking" && selectedBank) instrument.banks = [selectedBank]
        if (method === "wallet" && selectedWallet) instrument.wallets = [selectedWallet]

        const methodLabel: Record<string, string> = {
          upi: "UPI", netbanking: "Net Banking", wallet: "Wallet",
        }

        const options: Record<string, any> = {
          key: liveKeyId || RAZORPAY_KEY,
          amount: cart?.total || 0,
          currency: "INR",
          order_id: orderId,
          name: "VastuCart",
          description: "Secure Checkout",
          prefill: {
            email: contactEmail,
            contact: shippingAddr?.phone || "",
            method,
          },
          config: {
            display: {
              blocks: {
                primary: { name: `Pay via ${methodLabel[method]}`, instruments: [instrument] },
              },
              sequence: ["block.primary"],
              preferences: { show_default_blocks: false },
            },
          },
          theme: { color: primary[500] },
          handler: async (_response: any) => {
            try {
              const { orderId: medusaOrderId } = await completeCheckout()
              router.push(`/order-confirmation/${medusaOrderId}?clear=1`)
              resolve()
            } catch (err: any) { reject(err) }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled. Your cart is safe — try again when ready.")),
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzpRef.current = rzp
        rzp.on("payment.failed", (r: any) => {
          reject(new Error(r?.error?.description || "Payment failed. Please try again."))
        })
        rzp.open()
      })
    } catch (err: any) {
      setLocalError(err?.message || "Payment failed. Please try again.")
    } finally {
      setRzpLoading(false)
    }
  }

  const handleRazorpayPayment = async () => {
    if (rzpTab === "card") {
      await handleRazorpayCardPayment()
    } else {
      await handleRazorpayModalPayment(rzpTab as "upi" | "netbanking" | "wallet")
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
      const intentRes = await fetch(`${BACKEND_URL}/store/stripe/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "USD" }),
      })
      const intentData = await intentRes.json()
      if (!intentRes.ok || !intentData.client_secret) {
        throw new Error(intentData.error || "Failed to initialize payment. Please try again.")
      }
      const { error: stripeError } = await stripeRef.current.confirmCardPayment(intentData.client_secret, {
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
      })
      if (stripeError) throw new Error(stripeError.message || "Payment failed. Please try again.")
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
    if (paymentMethod === "stripe") { await handleStripePayment(); return }
    if (paymentMethod === "razorpay") { await handleRazorpayPayment(); return }
    if (paymentMethod === "cod") {
      if (codConfig) {
        if (codConfig.minOrder > 0 && grandTotal < codConfig.minOrder) {
          setLocalError(`COD requires a minimum order of ₹${codConfig.minOrder.toLocaleString("en-IN")}.`)
          return
        }
        if (codConfig.maxOrder < Infinity && grandTotal > codConfig.maxOrder) {
          setLocalError(`COD is not available for orders above ₹${codConfig.maxOrder.toLocaleString("en-IN")}.`)
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
      .filter(Boolean).join(", ")
  }
  const noPaymentConfigured = !showRazorpay && !showCod && !showStripe
  const anyLoading = isProcessing || rzpLoading || stripeLoading

  const rzpPayBtnLabel = () => {
    if (rzpLoading) {
      if (rzpTab === "card") return "Processing..."
      return "Opening Payment..."
    }
    return `Pay ${formatPrice(grandTotal, currency)}`
  }

  // ─── Styles shared for card inputs ─────────────────────────────────────────
  const inputBase = (valid: boolean | null): React.CSSProperties => ({
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: `1.5px solid ${valid === null ? "#e8e0d8" : valid ? "#10B981" : "#EF4444"}`,
    borderRadius: 8,
    outline: "none",
    color: earth[700],
    fontFamily: fonts.body,
    background: "#fff",
    boxSizing: "border-box",
  })

  // ─── Render ────────────────────────────────────────────────────────────────

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

      {/* ── Payment method selection ── */}
      <div>
        <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: earth[500] }}>Payment Method</p>
        <div className="space-y-2">

          {/* ── Stripe (international) ── */}
          {showStripe && (
            <label
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${paymentMethod === "stripe" ? primary[500] : "#e8e0d8"}`,
                background: paymentMethod === "stripe" ? primary[50] : bg.card,
              }}
            >
              <input
                type="radio" name="payment" value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                style={{ accentColor: primary[500], marginTop: 2 }}
              />
              <CreditCard className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: paymentMethod === "stripe" ? primary[500] : earth[400] }} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: earth[700] }}>Card Payment</p>
                <p className="text-xs mb-3" style={{ color: earth[400] }}>Credit or debit card — secured by Stripe</p>
                {paymentMethod === "stripe" && (
                  <div ref={cardContainerRef} className="p-3 rounded-lg" style={{ background: "#fff", border: "1px solid #e8e0d8" }} />
                )}
              </div>
            </label>
          )}

          {/* ── Razorpay (India) — custom branded inline UI ── */}
          {showRazorpay && (
            <div>
              {/* Radio selector row */}
              <label
                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  border: `1.5px solid ${paymentMethod === "razorpay" ? primary[500] : "#e8e0d8"}`,
                  background: paymentMethod === "razorpay" ? primary[50] : bg.card,
                  borderRadius: paymentMethod === "razorpay" ? "12px 12px 0 0" : 12,
                  borderBottom: paymentMethod === "razorpay" ? "none" : undefined,
                }}
              >
                <input
                  type="radio" name="payment" value="razorpay"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  style={{ accentColor: primary[500] }}
                />
                <CreditCard className="w-4 h-4 flex-shrink-0" style={{ color: paymentMethod === "razorpay" ? primary[500] : earth[400] }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: earth[700] }}>Online Payment</p>
                  <p className="text-xs" style={{ color: earth[400] }}>Card · UPI · Net Banking · Wallets</p>
                </div>
                {paymentMethod === "razorpay" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: primary[100], color: primary[500] }}>
                    Recommended
                  </span>
                )}
              </label>

              {/* Expanded inline panel */}
              {paymentMethod === "razorpay" && (
                <div style={{
                  border: `1.5px solid ${primary[500]}`,
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  overflow: "hidden",
                }}>
                  {/* Branded header */}
                  <div style={{ background: primary[500], padding: "10px 16px" }}>
                    <div className="flex items-center justify-between">
                      <span style={{ color: "white", fontSize: 13, fontWeight: 700, fontFamily: fonts.heading, letterSpacing: "0.02em" }}>
                        VastuCart Secure Checkout
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Shield size={11} style={{ color: "rgba(255,255,255,0.75)" }} />
                        <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: fonts.body }}>
                          256-bit SSL · PCI-DSS
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Method tabs */}
                  <div className="flex" style={{ borderBottom: `1px solid ${primary[100]}`, background: primary[50] }}>
                    {[
                      { id: "card" as RzpTab, icon: <CreditCard size={13} />, label: "Card" },
                      { id: "upi" as RzpTab, icon: <Smartphone size={13} />, label: "UPI" },
                      { id: "netbanking" as RzpTab, icon: <Building2 size={13} />, label: "Net Banking" },
                      { id: "wallet" as RzpTab, icon: <Wallet size={13} />, label: "Wallets" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => { setRzpTab(tab.id); setLocalError(null) }}
                        className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
                        style={{
                          fontSize: 10,
                          fontWeight: rzpTab === tab.id ? 700 : 500,
                          color: rzpTab === tab.id ? primary[500] : earth[400],
                          borderBottom: `2px solid ${rzpTab === tab.id ? primary[500] : "transparent"}`,
                          background: "transparent",
                          cursor: "pointer",
                          fontFamily: fonts.body,
                        }}
                      >
                        <span style={{ color: rzpTab === tab.id ? primary[500] : earth[400] }}>{tab.icon}</span>
                        <span className="hidden sm:block">{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab content area */}
                  <div style={{ padding: 16, background: "white" }}>

                    {/* ── Card tab ── */}
                    {rzpTab === "card" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Card number */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 4, fontFamily: fonts.body }}>
                            Card Number
                          </label>
                          <div style={{ position: "relative" }}>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              placeholder="1234  5678  9012  3456"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(fmtCardNumber(e.target.value))}
                              maxLength={19}
                              style={{
                                ...inputBase(cardNumber ? cardValid : null),
                                paddingRight: cardBrand ? 60 : 12,
                                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                                letterSpacing: "0.08em",
                              }}
                            />
                            {cardBrand && (
                              <span style={{
                                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                                fontSize: 9, fontWeight: 800, letterSpacing: "0.05em",
                                color: primary[400], fontFamily: fonts.body,
                                background: primary[50], padding: "2px 5px", borderRadius: 4,
                              }}>
                                {cardBrand}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cardholder name */}
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 4, fontFamily: fonts.body }}>
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            autoComplete="cc-name"
                            placeholder="Name as on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            style={{
                              ...inputBase(cardName ? nameValid : null),
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}
                          />
                        </div>

                        {/* Expiry + CVV */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 4, fontFamily: fonts.body }}>
                              Expiry
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              placeholder="MM / YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(fmtExpiry(e.target.value))}
                              maxLength={5}
                              style={{
                                ...inputBase(cardExpiry ? expiryValid : null),
                                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 4, fontFamily: fonts.body }}>
                              CVV
                            </label>
                            <div style={{ position: "relative" }}>
                              <input
                                type={showCvv ? "text" : "password"}
                                inputMode="numeric"
                                autoComplete="cc-csc"
                                placeholder="•••"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                maxLength={4}
                                style={{
                                  ...inputBase(cardCvv ? cvvValid : null),
                                  paddingRight: 36,
                                  fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setShowCvv(!showCvv)}
                                style={{
                                  position: "absolute", right: 10, top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1,
                                }}
                              >
                                {showCvv
                                  ? <EyeOff size={14} color={earth[400]} />
                                  : <Eye size={14} color={earth[400]} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: 10, color: earth[400], fontFamily: fonts.body, marginTop: 2 }}>
                          🔒 Your card details are encrypted and processed directly by Razorpay — never stored on VastuCart servers.
                        </p>
                      </div>
                    )}

                    {/* ── UPI tab ── */}
                    {rzpTab === "upi" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <p style={{ fontSize: 12, color: earth[500], fontFamily: fonts.body }}>
                          Pay instantly using any UPI app on your phone.
                        </p>

                        {/* App pills */}
                        <div className="flex flex-wrap gap-2">
                          {["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Others"].map((app) => (
                            <span
                              key={app}
                              style={{
                                padding: "5px 10px",
                                borderRadius: 20,
                                border: `1px solid ${primary[100]}`,
                                fontSize: 11,
                                color: earth[600],
                                fontFamily: fonts.body,
                                background: primary[50],
                              }}
                            >
                              {app}
                            </span>
                          ))}
                        </div>

                        <div style={{
                          padding: "10px 12px", borderRadius: 8,
                          background: "#f0fdf4", border: "1px solid #bbf7d0",
                        }}>
                          <p style={{ fontSize: 11, color: "#065f46", fontFamily: fonts.body }}>
                            ✓ You&apos;ll be shown a QR code and UPI app options to complete the payment securely.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Net Banking tab ── */}
                    {rzpTab === "netbanking" && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 8, fontFamily: fonts.body }}>
                          Select Your Bank
                        </label>
                        <div style={{ position: "relative" }}>
                          <select
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "10px 36px 10px 12px",
                              fontSize: 13,
                              border: `1.5px solid ${selectedBank ? primary[200] : "#e8e0d8"}`,
                              borderRadius: 8,
                              fontFamily: fonts.body,
                              color: selectedBank ? earth[700] : earth[400],
                              background: "white",
                              appearance: "none",
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            <option value="">— Choose your bank —</option>
                            {BANKS.map((bank) => (
                              <option key={bank.code} value={bank.code}>{bank.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} style={{
                            position: "absolute", right: 12, top: "50%",
                            transform: "translateY(-50%)", color: earth[400], pointerEvents: "none",
                          }} />
                        </div>
                        {selectedBank && (
                          <p style={{ fontSize: 10, color: earth[400], marginTop: 6, fontFamily: fonts.body }}>
                            You&apos;ll be redirected to your bank&apos;s secure internet banking page.
                          </p>
                        )}
                      </div>
                    )}

                    {/* ── Wallets tab ── */}
                    {rzpTab === "wallet" && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 8, fontFamily: fonts.body }}>
                          Select Wallet
                        </label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {WALLETS.map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => setSelectedWallet(w.id)}
                              style={{
                                padding: "10px 8px",
                                borderRadius: 8,
                                border: `1.5px solid ${selectedWallet === w.id ? primary[500] : "#e8e0d8"}`,
                                background: selectedWallet === w.id ? primary[50] : "white",
                                color: selectedWallet === w.id ? primary[500] : earth[600],
                                fontSize: 12,
                                fontWeight: 600,
                                fontFamily: fonts.body,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s",
                              }}
                            >
                              {w.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Cash on Delivery ── */}
          {showCod && (
            <label
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${paymentMethod === "cod" ? primary[500] : "#e8e0d8"}`,
                background: paymentMethod === "cod" ? primary[50] : bg.card,
              }}
            >
              <input
                type="radio" name="payment" value="cod"
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
                  {codConfig?.minOrder && codConfig.minOrder > 0 ? ` · Min order ₹${codConfig.minOrder.toLocaleString("en-IN")}` : ""}
                  {codConfig?.maxOrder && codConfig.maxOrder < Infinity ? ` · Max ₹${codConfig.maxOrder.toLocaleString("en-IN")}` : ""}
                </p>
              </div>
            </label>
          )}

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

      {/* Action buttons */}
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
            ? paymentMethod === "razorpay"
              ? rzpPayBtnLabel()
              : isProcessing ? "Placing Order..." : "Processing..."
            : paymentMethod === "cod"
              ? `Place Order · ₹${grandTotal.toLocaleString("en-IN")} (COD)`
              : `Pay ${formatPrice(grandTotal, currency)}`}
        </button>
      </div>
    </div>
  )
}
