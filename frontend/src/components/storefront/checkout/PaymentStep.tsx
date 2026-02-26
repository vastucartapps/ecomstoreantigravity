"use client"

import { useEffect, useRef, useState } from "react"
import {
  Shield, ArrowLeft, Package, MapPin, Truck,
  Eye, EyeOff, ChevronDown, Check,
  CreditCard, Smartphone, Building2, Wallet, Banknote, Lock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/providers/cart-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, earth, bg, fonts, secondary } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// ─── Script loaders ───────────────────────────────────────────────────────────

let _rzpLoaded = false
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if (_rzpLoaded && (window as any).Razorpay) return resolve(true)
    const tryLoad = (src: string, fb?: () => void) => {
      const s = document.createElement("script")
      s.src = src
      s.onload = () => { _rzpLoaded = true; resolve(true) }
      s.onerror = () => fb ? fb() : resolve(false)
      document.body.appendChild(s)
    }
    tryLoad("https://checkout.razorpay.com/v1/razorpay.js",
      () => tryLoad("https://checkout.razorpay.com/v1/checkout.js"))
  })
}

function loadStripeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false)
    if ((window as any).Stripe) return resolve(true)
    const s = document.createElement("script")
    s.src = "https://js.stripe.com/v3/"
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  if (currency === "usd") return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
  return `₹${amount.toLocaleString("en-IN")}`
}

function luhnCheck(num: string) {
  const d = num.replace(/\D/g, "")
  if (d.length < 13) return false
  let sum = 0, even = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10)
    if (even) { n *= 2; if (n > 9) n -= 9 }
    sum += n; even = !even
  }
  return sum % 10 === 0
}

function fmtCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
}
function fmtExp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 4)
  return d.length >= 2 ? d.slice(0, 2) + "/" + d.slice(2) : d
}
function cardBrand(n: string) {
  const s = n.replace(/\D/g, "")
  if (/^4/.test(s)) return "VISA"
  if (/^5[1-5]|^2[2-7]/.test(s)) return "MC"
  if (/^3[47]/.test(s)) return "AMEX"
  if (/^6[0-9]/.test(s)) return "RUPAY"
  return ""
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const POP_BANKS = [
  { code: "SBIN", short: "SBI", color: "#1E3A7B" },
  { code: "HDFC", short: "HDFC", color: "#004C8F" },
  { code: "ICIC", short: "ICICI", color: "#B05A00" },
  { code: "UTIB", short: "Axis", color: "#800040" },
  { code: "KKBK", short: "Kotak", color: "#C0392B" },
  { code: "PUNB", short: "PNB", color: "#1A4A7A" },
]

const ALL_BANKS = [
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
  { id: "phonepe", name: "PhonePe", color: "#5F259F" },
  { id: "paytm", name: "Paytm", color: "#002970" },
  { id: "amazonpay", name: "Amazon Pay", color: "#E47911" },
  { id: "mobikwik", name: "MobiKwik", color: "#1C1C6C" },
  { id: "freecharge", name: "Freecharge", color: "#E85D04" },
  { id: "olamoney", name: "Ola Money", color: "#1C3F79" },
]

const UPI_APPS = [
  { name: "GPay", short: "G", color: "#4285F4" },
  { name: "PhonePe", short: "Pe", color: "#5F259F" },
  { name: "Paytm", short: "Pa", color: "#002970" },
  { name: "BHIM", short: "B", color: "#00875A" },
  { name: "Amazon", short: "A", color: "#E47911" },
  { name: "Others", short: "+", color: "#71685b" },
]

// ─── SVG Payment Icons ────────────────────────────────────────────────────────

const VisaIcon = () => (
  <svg viewBox="0 0 60 20" width="40" height="14" aria-label="Visa">
    <text x="0" y="17" fontSize="20" fontWeight="900" fontStyle="italic" fill="#1A1F71" fontFamily="Arial,sans-serif">VISA</text>
  </svg>
)

const MastercardIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size * 0.63} viewBox="0 0 40 25" aria-label="Mastercard">
    <circle cx="15" cy="12.5" r="12.5" fill="#EB001B" />
    <circle cx="25" cy="12.5" r="12.5" fill="#F79E1B" />
    <path d="M20 4.1C22.8 6.5 24.6 9.8 24.6 12.5S22.8 18.5 20 20.9C17.2 18.5 15.4 15.2 15.4 12.5S17.2 6.5 20 4.1Z" fill="#FF5F00" />
  </svg>
)

const RuPayIcon = () => (
  <svg viewBox="0 0 52 20" width="44" height="16" aria-label="RuPay">
    <rect width="52" height="20" rx="3" fill="#006A9E" />
    <text x="5" y="14" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">RuPay</text>
  </svg>
)

const UPIBadge = ({ size = 38 }: { size?: number }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 38 19" aria-label="UPI">
    <rect width="38" height="19" rx="3" fill="#5F259F" />
    <text x="7" y="13" fontSize="11" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">UPI</text>
  </svg>
)

// ─── Animated Card Preview ────────────────────────────────────────────────────

function CardPreview({ number, name, expiry, brand, flipped, cvv }: {
  number: string; name: string; expiry: string
  brand: string; flipped: boolean; cvv: string
}) {
  return (
    <div style={{ perspective: "1200px", height: 190, marginBottom: 4, userSelect: "none" }}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        borderRadius: 18,
        boxShadow: "0 24px 60px rgba(1,63,71,0.38), 0 8px 20px rgba(1,63,71,0.18)",
      }}>

        {/* ── FRONT ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18,
          background: "linear-gradient(135deg, #013f47 0%, #066058 45%, #1a8a78 100%)",
          backfaceVisibility: "hidden",
          padding: "20px 22px",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          overflow: "hidden",
        }}>
          {/* gloss overlay */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: 18,
            background: "radial-gradient(ellipse at 75% 15%, rgba(255,255,255,0.09) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(255,255,255,0.05) 0%, transparent 45%)",
            pointerEvents: "none",
          }} />

          {/* top row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
            {/* EMV Chip */}
            <div style={{
              width: 40, height: 30, borderRadius: 5,
              background: "linear-gradient(135deg, #c8a020, #e8c840, #b89020)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2, padding: 4,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: "rgba(80,50,0,0.2)", borderRadius: 1 }} />
              ))}
            </div>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", height: 30 }}>
              {brand === "VISA" && <svg viewBox="0 0 56 20" width="50" height="18"><text x="0" y="17" fontSize="20" fontWeight="900" fontStyle="italic" fill="white" fontFamily="Arial,sans-serif">VISA</text></svg>}
              {brand === "MC" && (
                <svg width="42" height="26" viewBox="0 0 42 26">
                  <circle cx="15" cy="13" r="13" fill="#EB001B" opacity="0.92" />
                  <circle cx="27" cy="13" r="13" fill="#F79E1B" opacity="0.92" />
                  <path d="M21 3.5C23.8 5.9 25.6 9.3 25.6 13S23.8 20.1 21 22.5C18.2 20.1 16.4 16.7 16.4 13S18.2 5.9 21 3.5Z" fill="#FF5F00" opacity="0.92" />
                </svg>
              )}
              {brand === "AMEX" && <svg viewBox="0 0 50 18" width="46" height="16"><text x="0" y="14" fontSize="13" fontWeight="900" fill="white" fontFamily="Arial,sans-serif">AMEX</text></svg>}
              {brand === "RUPAY" && <svg viewBox="0 0 58 18" width="54" height="16"><text x="0" y="14" fontSize="13" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">RuPay</text></svg>}
              {!brand && <CreditCard size={26} style={{ color: "rgba(255,255,255,0.3)" }} />}
            </div>
          </div>

          {/* Card number */}
          <div style={{
            fontFamily: "'IBM Plex Mono','Courier New',monospace",
            fontSize: 19, color: "white", letterSpacing: "0.22em",
            textShadow: "0 1px 4px rgba(0,0,0,0.25)", position: "relative",
          }}>
            {number || "•••• •••• •••• ••••"}
          </div>

          {/* bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", position: "relative" }}>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginBottom: 3, letterSpacing: "0.15em" }}>CARD HOLDER</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 600, letterSpacing: "0.05em", maxWidth: 170, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name || "YOUR NAME"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", marginBottom: 3, letterSpacing: "0.15em" }}>EXPIRES</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 600, fontFamily: "'IBM Plex Mono',monospace" }}>
                {expiry || "••/••"}
              </div>
            </div>
          </div>
        </div>

        {/* ── BACK ── */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18,
          background: "linear-gradient(135deg, #1a3830 0%, #0c2420 100%)",
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          overflow: "hidden",
        }}>
          <div style={{ height: 46, background: "#0a0a0a", margin: "30px 0 14px" }} />
          <div style={{ padding: "0 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, height: 40, borderRadius: 5,
              background: "repeating-linear-gradient(90deg,#f5f0e6 0,#f5f0e6 5px,#e0d8cc 5px,#e0d8cc 6px)",
              display: "flex", alignItems: "center", paddingLeft: 10,
            }}>
              <span style={{ fontFamily: "cursive", fontSize: 18, color: "#444", opacity: 0.5 }}>
                {name ? name.split("").map((c, i) => i % 2 === 0 ? c : c.toLowerCase()).join("") : "Authorized Signature"}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.45)", marginBottom: 2, textAlign: "center", letterSpacing: "0.1em" }}>CVV</div>
              <div style={{ width: 52, height: 40, borderRadius: 5, background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 17, color: "#222", letterSpacing: "0.12em" }}>
                  {cvv ? "•".repeat(cvv.length) : "•••"}
                </span>
              </div>
            </div>
          </div>
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 44, height: 30, borderRadius: 5,
              background: "linear-gradient(135deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#c77dff,#ff6b6b)",
              backgroundSize: "300% 300%", opacity: 0.65,
            }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontFamily: fonts.body }}>Hologram</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Payment Method Card ───────────────────────────────────────────────────────

function PayMethodCard({
  selected, onClick, icon, title, subtitle, badge, popular, children,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  badge?: React.ReactNode
  popular?: boolean
  children?: React.ReactNode
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick() }}
      style={{
        borderRadius: 16,
        border: `2px solid ${selected ? primary[500] : "#e8e0d8"}`,
        background: selected ? "#f0f9f7" : bg.card,
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        boxShadow: selected
          ? `0 0 0 4px rgba(1,63,71,0.1), 0 6px 20px rgba(1,63,71,0.12)`
          : "0 1px 4px rgba(0,0,0,0.06)",
        outline: "none",
      }}
    >
      {/* header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        {/* icon circle */}
        <div style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          background: selected
            ? `linear-gradient(135deg, ${primary[500]}, ${primary[400]})`
            : "#f0ebe4",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: selected ? `0 4px 14px rgba(1,63,71,0.28)` : "none",
          transition: "all 0.22s ease",
        }}>
          <span style={{ color: selected ? "white" : earth[400] }}>{icon}</span>
        </div>

        {/* text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: earth[700], fontFamily: fonts.body }}>
              {title}
            </span>
            {popular && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: "0.04em",
                color: secondary[500], background: "#fff5ed",
                padding: "2px 7px", borderRadius: 20,
              }}>
                POPULAR
              </span>
            )}
          </div>
          <span style={{ fontSize: 11, color: earth[400], fontFamily: fonts.body, lineHeight: 1.4 }}>
            {subtitle}
          </span>
          {badge && <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>{badge}</div>}
        </div>

        {/* custom radio */}
        <div style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          border: `2.5px solid ${selected ? primary[500] : "#d0c8c0"}`,
          background: selected ? primary[500] : "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease",
        }}>
          {selected && <Check size={12} color="white" strokeWidth={3} />}
        </div>
      </div>

      {/* expanded content */}
      {selected && children && (
        <div
          style={{ borderTop: `1px solid ${primary[100]}`, background: "white", padding: "18px 16px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Input helper ─────────────────────────────────────────────────────────────

const inputStyle = (valid: boolean | null): React.CSSProperties => ({
  width: "100%",
  padding: "11px 12px",
  fontSize: 14,
  border: `1.5px solid ${valid === null ? "#e8e0d8" : valid ? "#10B981" : "#EF4444"}`,
  borderRadius: 10,
  outline: "none",
  color: earth[700],
  fontFamily: fonts.body,
  background: "#ffffff",
  transition: "border-color 0.15s",
  boxSizing: "border-box" as const,
})

// ─── Main Component ───────────────────────────────────────────────────────────

export function PaymentStep() {
  const router = useRouter()
  const { cart } = useCart()
  const {
    contactEmail, paymentMethod, setPaymentMethod,
    razorpayKeyId, stripePublishableKey, codEnabled, codConfig,
    shippingOptions, selectedShippingId,
    initPayment, completeCheckout, goBack,
    isProcessing, error, setError,
  } = useCheckout()

  const currency = (cart as any)?.currency_code || "inr"
  const isIntl = currency !== "inr"
  const RZP_KEY = razorpayKeyId || ""
  const showRzp = !isIntl && Boolean(RZP_KEY)
  const showCod = !isIntl && codEnabled
  const showStripe = isIntl && Boolean(stripePublishableKey)

  const [localErr, setLocalErr] = useState<string | null>(null)
  const [rzpLoading, setRzpLoading] = useState(false)
  const [stripeLoading, setStripeLoading] = useState(false)

  // Razorpay sub-method (card | upi | netbanking | wallet)
  type RzpM = "card" | "upi" | "netbanking" | "wallet"
  const [rzpM, setRzpM] = useState<RzpM>("card")

  // Card form
  const [cardNum, setCardNum] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExp, setCardExp] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [showCvv, setShowCvv] = useState(false)
  const [cvvFocused, setCvvFocused] = useState(false)

  // Net banking + wallets
  const [selBank, setSelBank] = useState("")
  const [selWallet, setSelWallet] = useState("")
  const [showMoreBanks, setShowMoreBanks] = useState(false)

  // Stripe
  const stripeRef = useRef<any>(null)
  const stripeElRef = useRef<any>(null)
  const cardElRef = useRef<any>(null)
  const cardContRef = useRef<HTMLDivElement>(null)
  const [stripeReady, setStripeReady] = useState(false)

  useEffect(() => { setError(null); initPayment() }, [])

  // default method
  useEffect(() => {
    if (paymentMethod === "system" || !paymentMethod) {
      if (showStripe) setPaymentMethod("stripe")
      else if (showRzp) setPaymentMethod("razorpay")
      else if (showCod) setPaymentMethod("cod")
    }
  }, [showStripe, showRzp, showCod])

  // Stripe card element
  useEffect(() => {
    if (!showStripe || !stripePublishableKey || paymentMethod !== "stripe") return
    let live = true
    const setup = async () => {
      const ok = await loadStripeScript()
      if (!ok || !live || !cardContRef.current) return
      if (!stripeRef.current) stripeRef.current = (window as any).Stripe(stripePublishableKey)
      if (!stripeElRef.current) stripeElRef.current = stripeRef.current.elements()
      if (cardElRef.current) { cardElRef.current.destroy(); cardElRef.current = null }
      const card = stripeElRef.current.create("card", {
        style: {
          base: { fontSize: "15px", color: "#433b35", fontFamily: "'Open Sans',sans-serif", "::placeholder": { color: "#a39585" } },
          invalid: { color: "#EF4444" },
        },
        hidePostalCode: true,
      })
      card.mount(cardContRef.current)
      cardElRef.current = card
      if (live) setStripeReady(true)
    }
    setup()
    return () => { live = false }
  }, [showStripe, stripePublishableKey, paymentMethod])

  // Cart values
  const items = cart?.items || []
  const subtotal = (cart?.subtotal || 0) / 100
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmt = (cart?.tax_total || 0) / 100
  const discountAmt = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const shippingAddr = cart?.shipping_address
  const selOption = shippingOptions.find((o) => o.id === selectedShippingId)

  // Card validation
  const digits = cardNum.replace(/\D/g, "")
  const brand = cardBrand(cardNum)
  const cardOk = digits.length >= 13 && luhnCheck(digits)
  const expOk = /^\d{2}\/\d{2}$/.test(cardExp) && (() => {
    const [mm, yy] = cardExp.split("/").map(Number)
    const now = new Date()
    const yr = 2000 + yy
    return mm >= 1 && mm <= 12 && (yr > now.getFullYear() || (yr === now.getFullYear() && mm - 1 >= now.getMonth()))
  })()
  const cvvOk = /^\d{3,4}$/.test(cardCvv)
  const nameOk = cardName.trim().length >= 2

  // ─── Razorpay card (custom checkout) ───────────────────────────────────────

  const handleRzpCard = async (): Promise<void> => {
    if (!cardOk) { setLocalErr("Please enter a valid card number."); return }
    if (!expOk) { setLocalErr("Please enter a valid expiry date (MM/YY)."); return }
    if (!cvvOk) { setLocalErr("Please enter the CVV."); return }
    if (!nameOk) { setLocalErr("Please enter the cardholder name."); return }

    setLocalErr(null); setError(null); setRzpLoading(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) throw new Error("Failed to load payment module. Check your internet connection.")

      const res = await fetch(`${BACKEND_URL}/store/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "INR" }),
      })
      const data = await res.json()
      if (!res.ok || !data.order_id) throw new Error(data.error || "Payment init failed. Please try again.")
      const { order_id, key_id } = data

      return new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({ key: key_id || RZP_KEY })
        rzp.on("payment.success", async () => {
          try {
            const { orderId } = await completeCheckout()
            router.push(`/order-confirmation/${orderId}?clear=1`)
            resolve()
          } catch (e: any) { reject(e) }
        })
        rzp.on("payment.error", (r: any) => reject(new Error(r?.error?.description || "Payment failed. Please try again.")))

        const [expM, expY] = cardExp.split("/").map((s) => s.trim())
        if (typeof rzp.createPayment === "function") {
          rzp.createPayment({
            amount: cart?.total || 0, currency: "INR", order_id,
            email: contactEmail, contact: shippingAddr?.phone || "",
            method: "card",
            "card[name]": cardName.trim(), "card[number]": digits,
            "card[cvv]": cardCvv, "card[expiry_month]": expM, "card[expiry_year]": expY,
          })
        } else {
          // Fallback: Standard Checkout, card-only
          const rzpStd = new (window as any).Razorpay({
            key: key_id || RZP_KEY, amount: cart?.total || 0, currency: "INR",
            order_id, name: "VastuCart",
            prefill: { name: cardName.trim(), email: contactEmail, contact: shippingAddr?.phone || "", method: "card" },
            config: { display: { blocks: { c: { name: "Card", instruments: [{ method: "card" }] } }, sequence: ["block.c"], preferences: { show_default_blocks: false } } },
            theme: { color: primary[500] },
            handler: async () => { try { const { orderId } = await completeCheckout(); router.push(`/order-confirmation/${orderId}?clear=1`); resolve() } catch (e: any) { reject(e) } },
            modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
          })
          rzpStd.on("payment.failed", (r: any) => reject(new Error(r?.error?.description || "Payment failed.")))
          rzpStd.open()
        }
      })
    } catch (e: any) {
      setLocalErr(e?.message || "Payment failed. Please try again.")
    } finally { setRzpLoading(false) }
  }

  // ─── Razorpay modal (UPI / NB / Wallet) ────────────────────────────────────

  const handleRzpModal = async (method: "upi" | "netbanking" | "wallet"): Promise<void> => {
    if (method === "netbanking" && !selBank) { setLocalErr("Please select your bank."); return }
    if (method === "wallet" && !selWallet) { setLocalErr("Please select a wallet."); return }

    setLocalErr(null); setError(null); setRzpLoading(true)
    try {
      const ok = await loadRazorpayScript()
      if (!ok) throw new Error("Failed to load payment module.")

      const res = await fetch(`${BACKEND_URL}/store/razorpay/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "INR" }),
      })
      const data = await res.json()
      if (!res.ok || !data.order_id) throw new Error(data.error || "Payment init failed.")
      const { order_id, key_id } = data

      return new Promise<void>((resolve, reject) => {
        const instrument: Record<string, any> = { method }
        if (method === "netbanking" && selBank) instrument.banks = [selBank]
        if (method === "wallet" && selWallet) instrument.wallets = [selWallet]

        const labels: Record<string, string> = { upi: "UPI", netbanking: "Net Banking", wallet: "Wallet" }
        const rzp = new (window as any).Razorpay({
          key: key_id || RZP_KEY, amount: cart?.total || 0, currency: "INR", order_id,
          name: "VastuCart", description: "Secure Checkout",
          prefill: { email: contactEmail, contact: shippingAddr?.phone || "", method },
          config: {
            display: {
              blocks: { p: { name: `Pay via ${labels[method]}`, instruments: [instrument] } },
              sequence: ["block.p"],
              preferences: { show_default_blocks: false },
            },
          },
          theme: { color: primary[500] },
          handler: async () => {
            try { const { orderId } = await completeCheckout(); router.push(`/order-confirmation/${orderId}?clear=1`); resolve() }
            catch (e: any) { reject(e) }
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled. Your cart is safe — try again when ready.")) },
        })
        rzp.on("payment.failed", (r: any) => reject(new Error(r?.error?.description || "Payment failed.")))
        rzp.open()
      })
    } catch (e: any) {
      setLocalErr(e?.message || "Payment failed. Please try again.")
    } finally { setRzpLoading(false) }
  }

  // ─── Stripe ─────────────────────────────────────────────────────────────────

  const handleStripe = async () => {
    setLocalErr(null); setError(null); setStripeLoading(true)
    try {
      if (!stripeRef.current || !cardElRef.current) throw new Error("Payment form not ready. Please wait.")
      const res = await fetch(`${BACKEND_URL}/store/stripe/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ amount: (cart?.total || 0) / 100, currency: "USD" }),
      })
      const d = await res.json()
      if (!res.ok || !d.client_secret) throw new Error(d.error || "Failed to initialize payment.")
      const { error: sErr } = await stripeRef.current.confirmCardPayment(d.client_secret, {
        payment_method: {
          card: cardElRef.current,
          billing_details: {
            name: [shippingAddr?.first_name, shippingAddr?.last_name].filter(Boolean).join(" "),
            email: contactEmail,
          },
        },
      })
      if (sErr) throw new Error(sErr.message || "Payment failed.")
      const { orderId } = await completeCheckout()
      router.push(`/order-confirmation/${orderId}?clear=1`)
    } catch (e: any) {
      setLocalErr(e?.message || "Payment failed.")
    } finally { setStripeLoading(false) }
  }

  // ─── Place order dispatcher ──────────────────────────────────────────────

  const handlePay = async () => {
    setLocalErr(null); setError(null)
    if (paymentMethod === "stripe") { await handleStripe(); return }
    if (paymentMethod === "razorpay") {
      if (rzpM === "card") await handleRzpCard()
      else await handleRzpModal(rzpM as "upi" | "netbanking" | "wallet")
      return
    }
    if (paymentMethod === "cod") {
      if (codConfig) {
        if (codConfig.minOrder > 0 && grandTotal < codConfig.minOrder) {
          setLocalErr(`Minimum order for COD is ₹${codConfig.minOrder.toLocaleString("en-IN")}.`); return
        }
        if (codConfig.maxOrder < Infinity && grandTotal > codConfig.maxOrder) {
          setLocalErr(`COD not available above ₹${codConfig.maxOrder.toLocaleString("en-IN")}.`); return
        }
      }
      try {
        const { orderId } = await completeCheckout()
        router.push(`/order-confirmation/${orderId}?clear=1`)
      } catch (e: any) { setLocalErr(e?.message || "Failed to place order.") }
      return
    }
    setLocalErr("Please select a payment method.")
  }

  const selectRzp = (m: RzpM) => { setRzpM(m); setPaymentMethod("razorpay"); setLocalErr(null) }
  const isRzp = (m: RzpM) => paymentMethod === "razorpay" && rzpM === m

  const displayErr = localErr || error
  const anyLoading = isProcessing || rzpLoading || stripeLoading
  const noPay = !showRzp && !showCod && !showStripe

  const formatAddr = () => {
    if (!shippingAddr) return "No address selected"
    return [shippingAddr.address_1, shippingAddr.city, shippingAddr.province, shippingAddr.postal_code].filter(Boolean).join(", ")
  }

  const payBtnLabel = () => {
    if (anyLoading) {
      if (rzpLoading && rzpM === "card") return "Processing..."
      if (rzpLoading) return "Opening Payment..."
      if (stripeLoading) return "Processing..."
      return "Placing Order..."
    }
    if (paymentMethod === "cod") return `Place Order · ₹${(grandTotal + (codConfig?.fee || 0)).toLocaleString("en-IN")} (COD)`
    return `Pay ${formatPrice(grandTotal, currency)} Securely`
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Order summary header ── */}
      <div style={{ borderRadius: 16, border: "1px solid #ede8e0", overflow: "hidden" }}>
        <div style={{ background: "#f9f6f2", padding: "10px 16px", borderBottom: "1px solid #ede8e0" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: earth[500], letterSpacing: "0.08em", fontFamily: fonts.body }}>ORDER SUMMARY</p>
        </div>
        <div>
          {items.slice(0, 3).map((item: any) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid #f5f0ea" }}>
              {item.thumbnail
                ? <img src={normalizeImageUrl(item.thumbnail)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid #f0ebe4" }} />
                : <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f0ebe4", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={18} style={{ color: earth[300] }} /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: earth[700], whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: fonts.body }}>{item.product_title || item.title}</p>
                {item.variant_title && <p style={{ fontSize: 11, color: earth[400], fontFamily: fonts.body }}>{item.variant_title}</p>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: earth[700], fontFamily: fonts.body }}>{formatPrice((item.unit_price || 0) / 100 * item.quantity, currency)}</p>
                <p style={{ fontSize: 11, color: earth[400], fontFamily: fonts.body }}>× {item.quantity}</p>
              </div>
            </div>
          ))}
          {items.length > 3 && <p style={{ padding: "6px 16px", fontSize: 11, color: earth[400], fontFamily: fonts.body }}>+{items.length - 3} more item{items.length - 3 > 1 ? "s" : ""}</p>}
        </div>
      </div>

      {/* ── Delivery chips ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { icon: <MapPin size={13} style={{ color: primary[500] }} />, label: "Deliver to", val: formatAddr() },
          { icon: <Truck size={13} style={{ color: primary[500] }} />, label: "Shipping", val: selOption?.name || "Standard Shipping" },
        ].map(({ icon, label, val }) => (
          <div key={label} style={{ padding: "10px 12px", borderRadius: 12, background: "#f9f6f2", border: "1px solid #f0ebe4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              {icon}
              <span style={{ fontSize: 10, fontWeight: 700, color: earth[600], fontFamily: fonts.body }}>{label}</span>
            </div>
            <p style={{ fontSize: 11, color: earth[500], fontFamily: fonts.body, lineHeight: 1.3 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* ── Payment methods ── */}
      <div>
        {/* Secure checkout header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 12,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: earth[500], letterSpacing: "0.08em", fontFamily: fonts.body }}>PAYMENT METHOD</p>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Lock size={11} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 10, color: "#10B981", fontWeight: 600, fontFamily: fonts.body }}>256-bit SSL Encrypted</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ── Stripe (international) ── */}
          {showStripe && (
            <PayMethodCard
              selected={paymentMethod === "stripe"}
              onClick={() => { setPaymentMethod("stripe"); setLocalErr(null) }}
              icon={<CreditCard size={20} />}
              title="Card Payment"
              subtitle="Credit or debit card — secured by Stripe"
              badge={<><VisaIcon /><MastercardIcon /></>}
            >
              <div ref={cardContRef} style={{ padding: "12px", borderRadius: 10, border: "1.5px solid #e8e0d8", background: "white" }} />
            </PayMethodCard>
          )}

          {/* ── Razorpay — Card ── */}
          {showRzp && (
            <PayMethodCard
              selected={isRzp("card")}
              onClick={() => selectRzp("card")}
              icon={<CreditCard size={20} />}
              title="Credit / Debit Card"
              subtitle="Visa · Mastercard · RuPay · Amex"
              badge={<><VisaIcon /><MastercardIcon size={28} /><RuPayIcon /></>}
            >
              {/* Animated card preview */}
              <CardPreview
                number={cardNum}
                name={cardName}
                expiry={cardExp}
                brand={brand}
                flipped={cvvFocused}
                cvv={cardCvv}
              />

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Card number */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 5, fontFamily: fonts.body, letterSpacing: "0.03em" }}>Card Number</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text" inputMode="numeric" autoComplete="cc-number"
                      placeholder="1234  5678  9012  3456"
                      value={cardNum}
                      onChange={(e) => setCardNum(fmtCard(e.target.value))}
                      maxLength={19}
                      style={{
                        ...inputStyle(cardNum ? cardOk : null),
                        paddingRight: brand ? 66 : 12,
                        fontFamily: "'IBM Plex Mono','Courier New',monospace",
                        letterSpacing: "0.1em",
                      }}
                    />
                    {brand && (
                      <span style={{
                        position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                        fontSize: 9, fontWeight: 800, color: primary[400],
                        background: primary[50], padding: "2px 6px", borderRadius: 5,
                        fontFamily: fonts.body, letterSpacing: "0.05em",
                      }}>{brand}</span>
                    )}
                  </div>
                </div>

                {/* Cardholder name */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 5, fontFamily: fonts.body, letterSpacing: "0.03em" }}>Cardholder Name</label>
                  <input
                    type="text" autoComplete="cc-name"
                    placeholder="Name as printed on card"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    style={{ ...inputStyle(cardName ? nameOk : null), textTransform: "uppercase", letterSpacing: "0.04em" }}
                  />
                </div>

                {/* Expiry + CVV */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 5, fontFamily: fonts.body, letterSpacing: "0.03em" }}>Expiry Date</label>
                    <input
                      type="text" inputMode="numeric" autoComplete="cc-exp"
                      placeholder="MM / YY"
                      value={cardExp}
                      onChange={(e) => setCardExp(fmtExp(e.target.value))}
                      maxLength={5}
                      style={{
                        ...inputStyle(cardExp ? expOk : null),
                        fontFamily: "'IBM Plex Mono','Courier New',monospace",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: earth[500], display: "block", marginBottom: 5, fontFamily: fonts.body, letterSpacing: "0.03em" }}>CVV</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showCvv ? "text" : "password"} inputMode="numeric" autoComplete="cc-csc"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        onFocus={() => setCvvFocused(true)}
                        onBlur={() => setCvvFocused(false)}
                        maxLength={4}
                        style={{ ...inputStyle(cardCvv ? cvvOk : null), paddingRight: 38, fontFamily: "'IBM Plex Mono','Courier New',monospace" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvv(!showCvv)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1 }}
                      >
                        {showCvv ? <EyeOff size={14} color={earth[400]} /> : <Eye size={14} color={earth[400]} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accepted networks */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
                  <span style={{ fontSize: 10, color: earth[400], fontFamily: fonts.body }}>Accepted:</span>
                  <VisaIcon /><MastercardIcon size={24} /><RuPayIcon />
                  <svg viewBox="0 0 50 18" width="38" height="14"><rect width="50" height="18" rx="3" fill="#0078C2" /><text x="4" y="13" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial,sans-serif">AMEX</text></svg>
                </div>

                <p style={{ fontSize: 10, color: earth[400], fontFamily: fonts.body }}>
                  🔒 Your card details are encrypted and processed directly by Razorpay — never stored on VastuCart servers.
                </p>
              </div>
            </PayMethodCard>
          )}

          {/* ── Razorpay — UPI ── */}
          {showRzp && (
            <PayMethodCard
              selected={isRzp("upi")}
              onClick={() => selectRzp("upi")}
              icon={<Smartphone size={20} />}
              title="UPI"
              subtitle="GPay · PhonePe · Paytm · BHIM · Amazon Pay"
              badge={<UPIBadge />}
              popular
            >
              <p style={{ fontSize: 12, color: earth[500], marginBottom: 12, fontFamily: fonts.body }}>
                Pay instantly using any UPI app on your phone. No card details needed.
              </p>
              {/* App grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8, marginBottom: 12 }}>
                {UPI_APPS.map((app) => (
                  <div key={app.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                      <span style={{ color: "white", fontSize: app.short.length > 1 ? 12 : 16, fontWeight: 800, fontFamily: fonts.body }}>{app.short}</span>
                    </div>
                    <span style={{ fontSize: 9, color: earth[500], fontFamily: fonts.body, textAlign: "center", lineHeight: 1.2 }}>{app.name}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p style={{ fontSize: 11, color: "#065f46", fontFamily: fonts.body }}>
                  ✓ A secure UPI payment screen will appear — choose your preferred app, scan QR, or approve via notification.
                </p>
              </div>
            </PayMethodCard>
          )}

          {/* ── Razorpay — Net Banking ── */}
          {showRzp && (
            <PayMethodCard
              selected={isRzp("netbanking")}
              onClick={() => selectRzp("netbanking")}
              icon={<Building2 size={20} />}
              title="Net Banking"
              subtitle="100+ Indian banks supported"
            >
              <p style={{ fontSize: 11, color: earth[400], marginBottom: 10, fontFamily: fonts.body }}>Select your bank:</p>

              {/* Popular bank chips */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                {POP_BANKS.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => setSelBank(b.code)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 10,
                      border: `1.5px solid ${selBank === b.code ? primary[500] : "#e8e0d8"}`,
                      background: selBank === b.code ? primary[50] : "white",
                      cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: b.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "white", fontSize: 9, fontWeight: 800, fontFamily: fonts.body }}>{b.short[0]}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: selBank === b.code ? primary[500] : earth[600], fontFamily: fonts.body, whiteSpace: "nowrap" }}>{b.short}</span>
                  </button>
                ))}
              </div>

              {/* More banks */}
              <button
                type="button"
                onClick={() => setShowMoreBanks(!showMoreBanks)}
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: primary[500], fontWeight: 600, fontFamily: fonts.body, background: "none", border: "none", cursor: "pointer", marginBottom: showMoreBanks ? 8 : 0, padding: 0 }}
              >
                <ChevronDown size={14} style={{ transform: showMoreBanks ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                {showMoreBanks ? "Show less" : "More banks"}
              </button>

              {showMoreBanks && (
                <div style={{ position: "relative" }}>
                  <select
                    value={POP_BANKS.find((b) => b.code === selBank) ? "" : selBank}
                    onChange={(e) => setSelBank(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 36px 10px 12px", fontSize: 13,
                      border: `1.5px solid ${selBank && !POP_BANKS.find((b) => b.code === selBank) ? primary[200] : "#e8e0d8"}`,
                      borderRadius: 10, fontFamily: fonts.body, color: earth[700],
                      background: "white", appearance: "none", outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">— Select bank —</option>
                    {ALL_BANKS.filter((b) => !POP_BANKS.find((pb) => pb.code === b.code)).map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: earth[400], pointerEvents: "none" }} />
                </div>
              )}

              {selBank && (
                <p style={{ fontSize: 10, color: earth[400], marginTop: 8, fontFamily: fonts.body }}>
                  You&apos;ll be redirected to <strong>{ALL_BANKS.find((b) => b.code === selBank)?.name || selBank}</strong>&apos;s secure net banking page.
                </p>
              )}
            </PayMethodCard>
          )}

          {/* ── Razorpay — Wallets ── */}
          {showRzp && (
            <PayMethodCard
              selected={isRzp("wallet")}
              onClick={() => selectRzp("wallet")}
              icon={<Wallet size={20} />}
              title="Wallets"
              subtitle="PhonePe · Paytm · Amazon Pay · MobiKwik · More"
            >
              <p style={{ fontSize: 11, color: earth[400], marginBottom: 10, fontFamily: fonts.body }}>Select your wallet:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {WALLETS.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelWallet(w.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                      border: `1.5px solid ${selWallet === w.id ? primary[500] : "#e8e0d8"}`,
                      background: selWallet === w.id ? primary[50] : "white",
                      cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: w.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "white", fontSize: 11, fontWeight: 800, fontFamily: fonts.body }}>{w.name[0]}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: selWallet === w.id ? primary[500] : earth[600], fontFamily: fonts.body }}>{w.name}</span>
                    {selWallet === w.id && <Check size={13} style={{ color: primary[500], marginLeft: "auto" }} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </PayMethodCard>
          )}

          {/* ── Cash on Delivery ── */}
          {showCod && (
            <PayMethodCard
              selected={paymentMethod === "cod"}
              onClick={() => { setPaymentMethod("cod"); setLocalErr(null) }}
              icon={<Banknote size={20} />}
              title={`Cash on Delivery${codConfig?.fee && codConfig.fee > 0 ? ` (+₹${codConfig.fee} fee)` : ""}`}
              subtitle={`Pay ₹${(grandTotal + (codConfig?.fee || 0)).toLocaleString("en-IN")} when your order arrives`}
            >
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
                <p style={{ fontSize: 11, color: "#92400e", fontFamily: fonts.body }}>
                  {codConfig?.minOrder && codConfig.minOrder > 0 ? `Minimum order ₹${codConfig.minOrder.toLocaleString("en-IN")} · ` : ""}
                  {codConfig?.maxOrder && codConfig.maxOrder < Infinity ? `Max ₹${codConfig.maxOrder.toLocaleString("en-IN")} · ` : ""}
                  Please keep exact change ready.
                </p>
              </div>
            </PayMethodCard>
          )}

          {noPay && (
            <div style={{ padding: 16, borderRadius: 14, background: "#FEF3C7", border: "1px solid #FDE68A" }}>
              <p style={{ fontSize: 13, color: "#92400E", fontFamily: fonts.body }}>No payment method configured. Please contact support.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Price breakdown ── */}
      <div style={{ borderRadius: 16, padding: 16, background: "#f9f6f2", border: "1px solid #f0ebe4" }}>
        {[
          { label: "Subtotal", value: subtotal },
          ...(shippingFee > 0 ? [{ label: "Shipping", value: shippingFee }] : []),
          ...(taxAmt > 0 ? [{ label: "Tax (GST)", value: taxAmt }] : []),
          ...(discountAmt > 0 ? [{ label: "Discount", value: -discountAmt, green: true }] : []),
        ].map(({ label, value, green }: any) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: earth[500], fontFamily: fonts.body }}>{label}</span>
            <span style={{ color: green ? "#10B981" : earth[600], fontWeight: green ? 600 : 400, fontFamily: fonts.body }}>
              {green ? "−" : ""}{formatPrice(Math.abs(value), currency)}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #e8e0d8", fontSize: 17, fontWeight: 800 }}>
          <span style={{ color: earth[700], fontFamily: fonts.heading }}>Total</span>
          <span style={{ color: primary[500], fontFamily: fonts.heading }}>{formatPrice(grandTotal, currency)}</span>
        </div>
      </div>

      {/* ── Trust bar ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", padding: "4px 0" }}>
        {[
          { icon: <Lock size={11} />, text: "256-bit SSL" },
          { icon: <Shield size={11} />, text: "PCI-DSS Certified" },
          { icon: <span style={{ fontSize: 10, fontWeight: 900 }}>R</span>, text: "Secured by Razorpay" },
          { icon: <Building2 size={11} />, text: "RBI Regulated" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: primary[400] }}>{icon}</span>
            <span style={{ fontSize: 10, color: earth[400], fontFamily: fonts.body }}>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {displayErr && (
        <div style={{ padding: "12px 14px", borderRadius: 12, background: "#FEF2F2", border: "1px solid #FCA5A5" }}>
          <p style={{ fontSize: 13, color: "#DC2626", fontFamily: fonts.body }}>{displayErr}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={goBack}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "14px 20px", borderRadius: 14, fontSize: 13, fontWeight: 600,
            border: "1.5px solid #e8e0d8", color: earth[600], background: "white",
            cursor: "pointer", flexShrink: 0, fontFamily: fonts.body,
          }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <button
          onClick={handlePay}
          disabled={anyLoading || noPay || (paymentMethod === "stripe" && !stripeReady && showStripe)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "15px 20px", borderRadius: 14, fontSize: 15, fontWeight: 800,
            color: "white", cursor: anyLoading ? "wait" : "pointer",
            background: anyLoading
              ? `linear-gradient(135deg, ${primary[400]}, ${primary[300]})`
              : `linear-gradient(135deg, ${primary[500]}, #054348)`,
            boxShadow: anyLoading ? "none" : `0 8px 24px rgba(1,63,71,0.35)`,
            transition: "all 0.2s ease",
            fontFamily: fonts.body,
            opacity: (anyLoading || noPay) ? 0.7 : 1,
          }}
        >
          {!anyLoading && <Lock size={15} />}
          {anyLoading && (
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: "spin 0.8s linear infinite" }}>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
              <path d="M8 2A6 6 0 0 1 14 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          )}
          {payBtnLabel()}
        </button>
      </div>

      {/* ── Bottom brand line ── */}
      <p style={{ textAlign: "center", fontSize: 10, color: earth[400], fontFamily: fonts.body }}>
        Your payment is processed securely. VastuCart does not store your card information.
      </p>
    </div>
  )
}
