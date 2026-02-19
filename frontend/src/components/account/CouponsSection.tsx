"use client"

import { useEffect, useState } from "react"
import { Tag, Copy, Check, Loader2, Clock } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { Coupon } from "@/types/dashboard"

export function CouponsSection() {
  const { fetchCoupons } = useDashboardData()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    fetchCoupons().then((c) => {
      setCoupons(c)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    } catch {}
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") return `${coupon.discountValue}% OFF`
    return `₹${coupon.discountValue} OFF`
  }

  const formatExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null
    const d = new Date(expiresAt)
    return `Expires ${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          Available Coupons
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          Apply these at checkout for instant discounts
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <Tag className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
          <p className="text-sm font-medium" style={{ color: earth[500] }}>No coupons available right now</p>
          <p className="text-xs mt-1" style={{ color: earth[300] }}>Check back soon for exclusive offers!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid #f0ebe4", background: bg.card }}
            >
              <div className="flex items-stretch">
                {/* Left: discount label */}
                <div
                  className="flex-shrink-0 flex flex-col items-center justify-center px-5 py-4 min-w-[100px]"
                  style={{ background: `linear-gradient(135deg, ${primary[500]}20, ${primary[50]})`, borderRight: "2px dashed #e8e0d8" }}
                >
                  <Tag className="w-5 h-5 mb-1" style={{ color: primary[500] }} />
                  <p className="text-sm font-bold text-center" style={{ color: primary[500], fontFamily: fonts.heading }}>
                    {formatDiscount(coupon)}
                  </p>
                </div>

                {/* Right: details */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="font-mono text-sm font-bold tracking-wider px-2 py-0.5 rounded"
                          style={{ background: "#f0ebe4", color: earth[700] }}
                        >
                          {coupon.code}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: earth[500] }}>{coupon.description}</p>
                      {coupon.minOrderValue && (
                        <p className="text-xs mt-1" style={{ color: earth[400] }}>
                          Min. order: ₹{coupon.minOrderValue.toLocaleString("en-IN")}
                        </p>
                      )}
                      {coupon.expiresAt && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" style={{ color: "#F59E0B" }} />
                          <p className="text-xs" style={{ color: "#F59E0B" }}>{formatExpiry(coupon.expiresAt)}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all"
                      style={{
                        background: copied === coupon.code ? "#10B981" : primary[500],
                        color: "#fff",
                      }}
                    >
                      {copied === coupon.code ? (
                        <><Check className="w-3.5 h-3.5" /> Copied!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info card */}
      <div className="p-4 rounded-xl" style={{ background: `${primary[50]}`, border: `1px solid ${primary[100]}` }}>
        <p className="text-xs" style={{ color: earth[600] }}>
          💡 <strong>Tip:</strong> Coupons are automatically applied when you enter the code at checkout. One coupon per order.
        </p>
      </div>
    </div>
  )
}
