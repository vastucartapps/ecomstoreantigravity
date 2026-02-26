"use client"

import { useState, useEffect } from "react"
import {
  Gift,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { GiftCard } from "@/types/dashboard"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function fmt(amount: number, currency: string) {
  const upper = (currency || "INR").toUpperCase()
  return upper === "USD"
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0 })}`
    : `₹${amount.toLocaleString("en-IN")}`
}

function statusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "active":
      return { bg: "#ECFDF5", text: "#065F46" }
    case "depleted":
      return { bg: "#FEF2F2", text: "#7F1D1D" }
    case "expired":
      return { bg: "#FFF7ED", text: "#7C2D12" }
    default:
      return { bg: "#F3F4F6", text: "#374151" }
  }
}

function GiftCardRow({ gc, onCopy }: { gc: GiftCard; onCopy: (code: string) => void }) {
  const sc = statusColor(gc.status || "active")
  const balanceMajor = (gc.balance || 0) / 100
  const valueMajor = (gc.value || gc.balance || 0) / 100

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl"
      style={{ background: "#fafafa", border: "1.5px solid #e8e0d8" }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${primary[500]}20, ${primary[100]})` }}
      >
        <Gift className="w-5 h-5" style={{ color: primary[500] }} />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-bold" style={{ color: earth[700] }}>
            {gc.code}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: sc.bg, color: sc.text }}
          >
            {gc.status || "Active"}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: primary[500] }}>
            {fmt(balanceMajor, gc.currency)} remaining
          </span>
          {valueMajor !== balanceMajor && (
            <span className="text-xs" style={{ color: earth[300] }}>
              of {fmt(valueMajor, gc.currency)}
            </span>
          )}
          {gc.expiresAt && (
            <span className="text-xs" style={{ color: earth[300] }}>
              · Expires {new Date(gc.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onCopy(gc.code)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
        style={{ background: bg.card, border: "1px solid #f0ebe4", color: earth[600] }}
      >
        <Copy className="w-3.5 h-3.5" />
        Copy Code
      </button>
    </div>
  )
}

export function GiftCardsSection() {
  const { fetchGiftCards } = useDashboardData()

  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Balance check
  const [checkCode, setCheckCode] = useState("")
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<{ balance: number; currency: string } | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)

  useEffect(() => {
    fetchGiftCards()
      .then(setGiftCards)
      .catch(() => setGiftCards([]))
      .finally(() => setIsLoading(false))
  }, [fetchGiftCards])

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      // fallback: select text
    }
  }

  const handleCheck = async () => {
    const trimmed = checkCode.trim().toUpperCase()
    if (!trimmed) return
    setChecking(true)
    setCheckResult(null)
    setCheckError(null)
    try {
      const res = await fetch(
        `${BACKEND_URL}/store/gift-cards/validate?code=${encodeURIComponent(trimmed)}`,
        { headers: { "x-publishable-api-key": PUB_KEY } }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Gift card not found")
      const gc = data.gift_card
      setCheckResult({
        balance: (gc.balance || 0) / 100,
        currency: (gc.currency_code || "INR").toUpperCase(),
      })
    } catch (err: any) {
      setCheckError(err.message || "Gift card not found or already used")
    } finally {
      setChecking(false)
    }
  }

  const activeCards = giftCards.filter((gc) => gc.status === "active")
  const otherCards = giftCards.filter((gc) => gc.status !== "active")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
            Gift Cards
          </h1>
          <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
            Manage and redeem your gift cards
          </p>
        </div>
        <a
          href="/gift-cards"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
        >
          <Gift className="w-4 h-4" />
          Buy Gift Card
        </a>
      </div>

      {/* My Gift Cards */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: earth[700] }}>My Gift Cards</h2>
          <button
            onClick={() => {
              setIsLoading(true)
              fetchGiftCards().then(setGiftCards).finally(() => setIsLoading(false))
            }}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: earth[300] }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: primary[300] }} />
          </div>
        ) : giftCards.length === 0 ? (
          <div className="text-center py-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: `${primary[50]}` }}
            >
              <Gift className="w-7 h-7" style={{ color: primary[400] }} />
            </div>
            <p className="text-sm font-medium" style={{ color: earth[600] }}>No gift cards yet</p>
            <p className="text-xs mt-1" style={{ color: earth[300] }}>
              Purchase a gift card or ask someone to send you one
            </p>
            <a
              href="/gift-cards"
              className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold"
              style={{ color: primary[500] }}
            >
              Buy a Gift Card <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCards.length > 0 && (
              <div className="space-y-2">
                {activeCards.map((gc) => (
                  <GiftCardRow
                    key={gc.id}
                    gc={gc}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            )}
            {otherCards.length > 0 && (
              <>
                {activeCards.length > 0 && (
                  <p className="text-xs font-semibold pt-2" style={{ color: earth[300] }}>Past Cards</p>
                )}
                <div className="space-y-2 opacity-60">
                  {otherCards.map((gc) => (
                    <GiftCardRow
                      key={gc.id}
                      gc={gc}
                      onCopy={handleCopy}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Copy confirmation toast */}
        {copiedCode && (
          <div
            className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg"
            style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}
          >
            <Check className="w-4 h-4" style={{ color: "#10B981" }} />
            <span className="text-xs font-semibold" style={{ color: "#065F46" }}>
              Code copied — apply it at checkout!
            </span>
          </div>
        )}
      </div>

      {/* Balance Check */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: earth[700] }}>
          Check Any Gift Card Balance
        </h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
            <input
              type="text"
              value={checkCode}
              onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="GC-XXXX-XXXX-XXXX"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none font-mono uppercase tracking-widest"
              style={{ border: "1.5px solid #e8e0d8", color: earth[700], background: "#fafafa" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={checking || !checkCode.trim()}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: primary[500] }}
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check
          </button>
        </div>

        {checkResult && (
          <div
            className="mt-4 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#065F46" }}>Valid Gift Card</p>
              <p className="text-lg font-bold" style={{ color: "#10B981" }}>
                {checkResult.currency} {checkResult.balance.toLocaleString("en-IN")} available
              </p>
            </div>
          </div>
        )}

        {checkError && (
          <div
            className="mt-4 p-4 rounded-xl flex items-center gap-3"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#EF4444" }} />
            <p className="text-sm" style={{ color: "#7F1D1D" }}>{checkError}</p>
          </div>
        )}
      </div>

      {/* How to use */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: earth[700] }}>How to Redeem</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Copy your gift card code using the button above" },
            { step: "2", text: "Add items to your cart and proceed to checkout" },
            { step: "3", text: "Enter the gift card code in the payment section" },
            { step: "4", text: "Balance is deducted automatically — pay the rest via any payment method" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: primary[500] }}
              >
                {item.step}
              </div>
              <p className="text-sm pt-0.5" style={{ color: earth[600] }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
