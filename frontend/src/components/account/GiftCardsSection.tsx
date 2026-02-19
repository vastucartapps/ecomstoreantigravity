"use client"

import { useState } from "react"
import { Gift, Search, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { primary, earth, bg, fonts } from "@/lib/theme"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export function GiftCardsSection() {
  const [code, setCode] = useState("")
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{ balance: number; currency: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    setChecking(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/store/gift-cards/${trimmed}`, {
        headers: { "x-publishable-api-key": PUB_KEY },
      })
      if (!res.ok) {
        setError("Gift card not found or already used")
        return
      }
      const data = await res.json()
      const gc = data.gift_card || data
      setResult({
        balance: (gc.balance || 0) / 100,
        currency: (gc.currency_code || "INR").toUpperCase(),
      })
    } catch {
      setError("Failed to check gift card. Please try again.")
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          Gift Cards
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          Check gift card balance or apply at checkout
        </p>
      </div>

      {/* Balance Check */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: earth[700] }}>Check Gift Card Balance</h2>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Gift className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              placeholder="Enter gift card code"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none font-mono uppercase"
              style={{ border: "1.5px solid #e8e0d8", color: earth[700], fontFamily: "monospace", background: "#fafafa" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={checking || !code.trim()}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-2"
            style={{ background: primary[500] }}
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check
          </button>
        </div>

        {result && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#10B981" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#065F46" }}>Valid Gift Card</p>
              <p className="text-lg font-bold" style={{ color: "#10B981" }}>
                {result.currency} {result.balance.toLocaleString("en-IN")} available
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#EF4444" }} />
            <p className="text-sm" style={{ color: "#7F1D1D" }}>{error}</p>
          </div>
        )}
      </div>

      {/* Empty state */}
      <div className="rounded-2xl p-8 text-center" style={{ background: `${primary[50]}`, border: `1px dashed ${primary[200]}` }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: `linear-gradient(135deg, ${primary[500]}20, ${primary[100]})` }}
        >
          <Gift className="w-8 h-8" style={{ color: primary[500] }} />
        </div>
        <h3 className="text-base font-semibold mb-2" style={{ color: earth[700], fontFamily: fonts.heading }}>
          Gift Cards Coming Soon
        </h3>
        <p className="text-sm max-w-xs mx-auto" style={{ color: earth[400] }}>
          Send the gift of wellness. VastuCart gift cards will be available soon for purchase and redemption.
        </p>
      </div>

      {/* How to use */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: earth[700] }}>How Gift Cards Work</h3>
        <div className="space-y-3">
          {[
            { step: "1", text: "Receive a gift card from a friend or purchase one" },
            { step: "2", text: "Enter the code above to check your balance" },
            { step: "3", text: "Apply the code at checkout — the balance is deducted automatically" },
            { step: "4", text: "Any remaining balance stays on the card for future use" },
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
