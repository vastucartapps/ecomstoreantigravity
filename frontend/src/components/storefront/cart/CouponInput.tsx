"use client"

import { useState } from "react"
import { Tag, X, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"

interface AppliedCoupon {
  code: string
  discountAmount: number
  description: string
}

interface AvailableCoupon {
  code: string
  description: string
  isApplicable: boolean
}

interface CouponInputProps {
  appliedCoupon?: AppliedCoupon | null
  availableCoupons?: AvailableCoupon[]
  currency: "INR" | "USD"
  onApply?: (code: string) => void
  onRemove?: () => void
  isLoading?: boolean
  error?: string | null
}

function fmt(amount: number, currency: "INR" | "USD") {
  return currency === "INR"
    ? `\u20B9${amount.toLocaleString("en-IN")}`
    : `$${amount.toLocaleString("en-US")}`
}

export function CouponInput({
  appliedCoupon,
  availableCoupons = [],
  currency,
  onApply,
  onRemove,
  isLoading = false,
  error,
}: CouponInputProps) {
  const [code, setCode] = useState("")
  const [showCoupons, setShowCoupons] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleApply = () => {
    if (!code.trim()) return
    onApply?.(code.trim().toUpperCase())
    setCode("")
  }

  const handleCopyAndApply = (couponCode: string) => {
    setCopiedCode(couponCode)
    onApply?.(couponCode)
    setTimeout(() => setCopiedCode(null), 1500)
  }

  if (appliedCoupon) {
    return (
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg"
        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
      >
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" style={{ color: "#16A34A" }} />
          <div>
            <span className="text-xs font-bold" style={{ color: "#16A34A" }}>
              {appliedCoupon.code}
            </span>
            <span className="text-xs ml-1.5" style={{ color: "#15803D" }}>
              -{fmt(appliedCoupon.discountAmount, currency)}
            </span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ color: "#16A34A" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{
              border: `1px solid ${error ? "#EF4444" : "#e8e0d8"}`,
              color: earth[700],
              fontFamily: fonts.mono,
              background: bg.card,
            }}
            onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = primary[500] }}
            onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "#e8e0d8" }}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || isLoading}
          className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: primary[500], fontFamily: fonts.body }}
        >
          {isLoading ? "..." : "Apply"}
        </button>
      </div>

      {error && (
        <p className="text-xs mt-1.5" style={{ color: "#EF4444" }}>{error}</p>
      )}

      {/* Available coupons toggle */}
      {availableCoupons.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowCoupons(!showCoupons)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: primary[500] }}
          >
            {showCoupons ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showCoupons ? "Hide" : "View"} Available Coupons ({availableCoupons.length})
          </button>

          {showCoupons && (
            <div className="mt-2 space-y-2">
              {availableCoupons.map((c) => (
                <div
                  key={c.code}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                  style={{ background: bg.primary, border: "1px dashed #e8e0d8" }}
                >
                  <div>
                    <span
                      className="text-xs font-bold tracking-wide"
                      style={{ color: earth[700], fontFamily: fonts.mono }}
                    >
                      {c.code}
                    </span>
                    <p className="text-[11px] mt-0.5" style={{ color: earth[400] }}>
                      {c.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyAndApply(c.code)}
                    disabled={!c.isApplicable}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      background: copiedCode === c.code ? "#F0FDF4" : primary[50],
                      color: copiedCode === c.code ? "#16A34A" : primary[500],
                    }}
                  >
                    {copiedCode === c.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedCode === c.code ? "Applied" : "Apply"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
