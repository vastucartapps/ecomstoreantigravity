"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Gift,
  CreditCard,
  Mail,
  User,
  MessageSquare,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const INR_DENOMINATIONS = [500, 1000, 2000, 5000]
const USD_DENOMINATIONS = [10, 25, 50, 100]

function fmt(amount: number, currency: "INR" | "USD") {
  return currency === "INR"
    ? `₹${amount.toLocaleString("en-IN")}`
    : `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
}

type PurchaseMode = "self" | "gift"
type PagePhase = "select" | "stripe-card" | "success"

interface SuccessData {
  code: string
  amount: number
  currency: "INR" | "USD"
  isGift: boolean
  recipientEmail?: string
}

export default function GiftCardsPage() {
  const { user } = useAuth()

  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [denomination, setDenomination] = useState(1000)
  const [mode, setMode] = useState<PurchaseMode>("self")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [message, setMessage] = useState("")

  const [phase, setPhase] = useState<PagePhase>("select")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SuccessData | null>(null)

  // Stripe state
  const stripeCardRef = useRef<HTMLDivElement>(null)
  const stripeRef = useRef<any>(null)
  const cardElementRef = useRef<any>(null)
  const [stripePayData, setStripePayData] = useState<{
    clientSecret: string
    publishableKey: string
  } | null>(null)
  const [stripeConfirming, setStripeConfirming] = useState(false)

  // Detect region from cookie
  useEffect(() => {
    const vcRegion = document.cookie
      .split("; ")
      .find((c) => c.startsWith("vc-region="))
      ?.split("=")?.[1]
    if (vcRegion === "international") {
      setCurrency("USD")
      setDenomination(25)
    }
  }, [])

  // Mount Stripe card element when in stripe-card phase
  useEffect(() => {
    if (phase !== "stripe-card" || !stripePayData || !stripeCardRef.current) return

    let mounted = true
    ;(async () => {
      try {
        // Load Stripe.js dynamically
        if (!(window as any).Stripe) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement("script")
            s.src = "https://js.stripe.com/v3/"
            s.onload = () => resolve()
            s.onerror = () => reject(new Error("Failed to load Stripe"))
            document.head.appendChild(s)
          })
        }

        if (!mounted) return

        const stripeInstance = (window as any).Stripe(stripePayData.publishableKey)
        stripeRef.current = stripeInstance

        const elements = stripeInstance.elements()
        const cardElement = elements.create("card", {
          style: {
            base: {
              fontSize: "14px",
              color: "#4a3f35",
              fontFamily: "'Inter', sans-serif",
              "::placeholder": { color: "#b8a898" },
            },
            invalid: { color: "#B91C1C" },
          },
        })

        if (stripeCardRef.current) {
          cardElement.mount(stripeCardRef.current)
          cardElementRef.current = cardElement
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load card form")
      }
    })()

    return () => {
      mounted = false
      cardElementRef.current?.unmount()
      cardElementRef.current = null
    }
  }, [phase, stripePayData])

  const denominations = currency === "INR" ? INR_DENOMINATIONS : USD_DENOMINATIONS

  const validate = (): string | null => {
    if (mode === "gift") {
      if (!recipientName.trim()) return "Please enter the recipient's name"
      if (!recipientEmail.trim()) return "Please enter the recipient's email"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) return "Please enter a valid email"
    }
    return null
  }

  const handleBuy = async () => {
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setError(null)
    setIsProcessing(true)

    try {
      const intentRes = await fetch(`${BACKEND_URL}/store/gift-cards/purchase-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        credentials: "include",
        body: JSON.stringify({
          amount_major: denomination,
          currency: currency.toLowerCase(),
          is_gift: mode === "gift",
          recipient_name: mode === "gift" ? recipientName.trim() : undefined,
          recipient_email: mode === "gift" ? recipientEmail.trim() : undefined,
          gift_message: mode === "gift" ? message.trim() : undefined,
        }),
      })

      const intentData = await intentRes.json()
      if (!intentRes.ok) throw new Error(intentData.error || "Payment init failed")

      if (intentData.provider === "razorpay") {
        await handleRazorpay(intentData)
      } else if (intentData.provider === "stripe") {
        await setupStripe(intentData)
      }
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRazorpay = useCallback(async (intentData: any) => {
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script")
        s.src = "https://checkout.razorpay.com/v1/checkout.js"
        s.onload = () => resolve()
        s.onerror = () => reject(new Error("Failed to load payment gateway"))
        document.head.appendChild(s)
      })
    }

    await new Promise<void>((resolve, reject) => {
      const rzp = new (window as any).Razorpay({
        key: intentData.key_id,
        amount: intentData.amount_paise,
        currency: "INR",
        order_id: intentData.order_id,
        name: "VastuCart",
        description: `Gift Card — ${fmt(denomination, "INR")}`,
        handler: async (response: any) => {
          try {
            await confirmPurchase({
              provider: "razorpay",
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
            })
            resolve()
          } catch (e: any) { reject(e) }
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      })
      rzp.open()
    })
  }, [denomination])

  const setupStripe = async (intentData: any) => {
    // Fetch Stripe publishable key from config
    const cfgRes = await fetch(`${BACKEND_URL}/store/payment-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
    })
    const cfg = cfgRes.ok ? await cfgRes.json() : {}
    const publishableKey = cfg.stripe_publishable_key
    if (!publishableKey) throw new Error("Stripe not configured")

    setStripePayData({ clientSecret: intentData.client_secret, publishableKey })
    setPhase("stripe-card")
  }

  const handleStripeConfirm = async () => {
    if (!stripeRef.current || !cardElementRef.current || !stripePayData) return
    setStripeConfirming(true)
    setError(null)
    try {
      const { paymentIntent, error: stripeError } = await stripeRef.current.confirmCardPayment(
        stripePayData.clientSecret,
        { payment_method: { card: cardElementRef.current } }
      )
      if (stripeError) throw new Error(stripeError.message)
      await confirmPurchase({
        provider: "stripe",
        stripe_payment_intent_id: paymentIntent.id,
      })
    } catch (err: any) {
      setError(err.message || "Payment failed")
    } finally {
      setStripeConfirming(false)
    }
  }

  const confirmPurchase = async (paymentInfo: Record<string, string>) => {
    const confirmRes = await fetch(`${BACKEND_URL}/store/gift-cards/purchase-confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
      credentials: "include",
      body: JSON.stringify({
        ...paymentInfo,
        amount_major: denomination,
        currency: currency.toLowerCase(),
        is_gift: mode === "gift",
        recipient_name: mode === "gift" ? recipientName.trim() : undefined,
        recipient_email: mode === "gift" ? recipientEmail.trim() : undefined,
        gift_message: mode === "gift" ? message.trim() : undefined,
        customer_id: user?.id || undefined,
      }),
    })

    const data = await confirmRes.json()
    if (!confirmRes.ok) throw new Error(data.error || "Failed to create gift card")

    setSuccess({
      code: data.gift_card.code,
      amount: denomination,
      currency,
      isGift: mode === "gift",
      recipientEmail: mode === "gift" ? recipientEmail.trim() : undefined,
    })
    setPhase("success")
  }

  // ─── Success screen ───────────────────────────────────────────────────────
  if (phase === "success" && success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: bg.primary }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "#F0FDF4" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "#16A34A" }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: earth[700], fontFamily: fonts.heading }}>
            Gift Card Created!
          </h1>
          <p className="text-sm mb-6" style={{ color: earth[400] }}>
            {success.isGift
              ? `Your gift card has been emailed to ${success.recipientEmail}`
              : "Your gift card has been linked to your account"}
          </p>

          <div className="rounded-2xl p-6 mb-6" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
            <div className="h-1 rounded-full mb-5" style={{ background: `linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]})` }} />
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: earth[300] }}>Gift Card Code</p>
            <p className="text-2xl font-bold font-mono mb-3" style={{ color: primary[500] }}>{success.code}</p>
            <p className="text-base font-semibold" style={{ color: earth[600] }}>
              Balance: {fmt(success.amount, success.currency)}
            </p>
            <p className="text-xs mt-1" style={{ color: earth[300] }}>Valid for 1 year · Unused balance stays on card</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!success.isGift && (
              <a
                href="/account/gift-cards"
                className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
              >
                View My Gift Cards
              </a>
            )}
            <a
              href="/"
              className="inline-block px-6 py-3 rounded-xl text-sm font-semibold"
              style={{ background: bg.card, border: "1px solid #f0ebe4", color: earth[600] }}
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ─── Stripe card entry screen ─────────────────────────────────────────────
  if (phase === "stripe-card") {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: bg.primary }}>
        <div className="max-w-md w-full">
          <button
            onClick={() => { setPhase("select"); setStripePayData(null); setError(null) }}
            className="flex items-center gap-1.5 text-sm mb-5"
            style={{ color: earth[400] }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="rounded-2xl overflow-hidden" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
            <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]})` }} />
            <div className="p-6">
              <h2 className="text-lg font-bold mb-1" style={{ color: earth[700], fontFamily: fonts.heading }}>
                Card Payment
              </h2>
              <p className="text-sm mb-5" style={{ color: earth[400] }}>
                Gift Card — {fmt(denomination, "USD")}
              </p>

              <div className="mb-5">
                <label className="text-xs font-medium block mb-2" style={{ color: earth[500] }}>
                  Card Details
                </label>
                <div
                  ref={stripeCardRef}
                  className="p-3 rounded-xl"
                  style={{ border: "1.5px solid #e8e0d8", minHeight: "44px" }}
                />
              </div>

              {error && (
                <p className="text-sm px-4 py-3 rounded-xl mb-4" style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                  {error}
                </p>
              )}

              <button
                onClick={handleStripeConfirm}
                disabled={stripeConfirming || !stripePayData}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
              >
                {stripeConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {stripeConfirming ? "Processing..." : `Pay ${fmt(denomination, "USD")}`}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4">
                <ShieldCheck className="w-3.5 h-3.5" style={{ color: earth[300] }} />
                <span className="text-xs" style={{ color: earth[300] }}>Secured by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main selection screen ────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4" style={{ background: bg.primary }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
          >
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: earth[700], fontFamily: fonts.heading }}>
            VastuCart Gift Cards
          </h1>
          <p className="text-base" style={{ color: earth[400] }}>
            The perfect gift for lovers of wellness and spirituality
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]})` }} />
          <div className="p-6 space-y-6">
            {/* Denomination picker */}
            <div>
              <label className="text-sm font-semibold block mb-3" style={{ color: earth[700] }}>
                Select Amount
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {denominations.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDenomination(d)}
                    className="py-3 rounded-xl text-sm font-bold transition-all"
                    style={{
                      background:
                        denomination === d
                          ? `linear-gradient(135deg, ${primary[500]}, #054348)`
                          : "#fafafa",
                      color: denomination === d ? "#fff" : earth[700],
                      border: denomination === d ? "none" : "1.5px solid #e8e0d8",
                    }}
                  >
                    {fmt(d, currency)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode toggle */}
            <div>
              <label className="text-sm font-semibold block mb-3" style={{ color: earth[700] }}>
                Who is this for?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "self", label: "For Myself", icon: CreditCard },
                  { id: "gift", label: "Send as Gift", icon: Gift },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      background:
                        mode === id
                          ? `linear-gradient(135deg, ${primary[500]}, #054348)`
                          : "#fafafa",
                      color: mode === id ? "#fff" : earth[700],
                      border: mode === id ? "none" : "1.5px solid #e8e0d8",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Gift recipient details */}
            {mode === "gift" && (
              <div
                className="space-y-4 p-4 rounded-xl"
                style={{ background: "#fafafa", border: "1.5px solid #e8e0d8" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: earth[400] }}>
                  Recipient Details
                </p>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: earth[500] }}>
                    Recipient Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ border: "1.5px solid #e8e0d8", color: earth[700], background: "#fff" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: earth[500] }}>
                    Recipient Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. priya@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ border: "1.5px solid #e8e0d8", color: earth[700], background: "#fff" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium block mb-1.5" style={{ color: earth[500] }}>
                    Personal Message (optional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 w-4 h-4" style={{ color: earth[300] }} />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write a heartfelt message..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none resize-none"
                      style={{ border: "1.5px solid #e8e0d8", color: earth[700], background: "#fff" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div
              className="p-4 rounded-xl"
              style={{ background: `${primary[50]}`, border: `1px solid ${primary[100]}` }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: earth[600] }}>You pay</span>
                <span className="text-xl font-bold" style={{ color: primary[500], fontFamily: fonts.heading }}>
                  {fmt(denomination, currency)}
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: earth[300] }}>
                Valid for 1 year · Unused balance stays on card · Non-refundable
              </p>
            </div>

            {error && (
              <p
                className="text-sm text-center px-4 py-3 rounded-xl"
                style={{ background: "#FEF2F2", color: "#B91C1C" }}
              >
                {error}
              </p>
            )}

            <button
              onClick={handleBuy}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, ${primary[500]}, #054348)`,
                fontFamily: fonts.body,
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Buy Gift Card
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: earth[300] }} />
              <span className="text-xs" style={{ color: earth[300] }}>Secure payment via {currency === "INR" ? "Razorpay" : "Stripe"}</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: earth[700] }}>How Gift Cards Work</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Choose & Pay", desc: "Pick an amount and pay securely" },
              { step: "2", title: "Instant Delivery", desc: "Code delivered instantly to your inbox or theirs" },
              { step: "3", title: "Redeem at Checkout", desc: "Apply code — balance auto-deducted from order" },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                  style={{ background: primary[500] }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: earth[700] }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
