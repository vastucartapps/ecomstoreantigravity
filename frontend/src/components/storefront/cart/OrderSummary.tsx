"use client"

import { Shield, Truck, RefreshCw, Sparkles } from "lucide-react"
import { primary, secondary, earth, bg, fonts, gradients } from "@/lib/theme"

interface OrderSummaryProps {
  subtotal: number
  mrpTotal?: number
  shippingFee: number
  taxAmount: number
  discountTotal: number
  grandTotal: number
  currency: "INR" | "USD"
  itemCount: number
  promoCode?: string | null
  giftCardDiscount?: number
  giftCardCode?: string | null
  /**
   * Cash-on-Delivery handling fee, in MAJOR units (rupees), added to the
   * displayed "You Pay" total when the customer has picked COD at the
   * shipping step. INR carts only — kept here (not in shippingFee) so we
   * can render a distinct line item the customer can recognise.
   */
  codFee?: number
  /** True when the customer has picked COD as the payment method. */
  codSelected?: boolean
  onProceedToCheckout?: () => void
  showCheckoutButton?: boolean
  showTrustBadges?: boolean
  isProcessing?: boolean
}

function fmt(amount: number, currency: "INR" | "USD") {
  return currency === "INR"
    ? `\u20B9${amount.toLocaleString("en-IN")}`
    : `$${amount.toLocaleString("en-US")}`
}

export function OrderSummary({
  subtotal,
  mrpTotal,
  shippingFee,
  taxAmount,
  discountTotal,
  grandTotal,
  currency,
  itemCount,
  promoCode,
  giftCardDiscount = 0,
  giftCardCode,
  codFee = 0,
  codSelected = false,
  onProceedToCheckout,
  showCheckoutButton = true,
  showTrustBadges = true,
  isProcessing = false,
}: OrderSummaryProps) {
  const totalSavings = (mrpTotal || subtotal) - subtotal + discountTotal + giftCardDiscount
  const effectiveCodFee = codSelected && codFee > 0 ? codFee : 0
  const payTotal = Math.max(0, grandTotal - giftCardDiscount + effectiveCodFee)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: bg.card, border: "1px solid #f0ebe4" }}
    >
      {/* Gradient accent */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]})` }} />

      <div className="p-5">
        <h3 className="text-base font-bold mb-4" style={{ color: earth[700], fontFamily: fonts.heading }}>
          Order Summary
        </h3>

        <div className="space-y-2.5">
          {/* MRP Total */}
          {mrpTotal && mrpTotal > subtotal && (
            <div className="flex justify-between text-sm">
              <span style={{ color: earth[400] }}>MRP Total</span>
              <span className="line-through" style={{ color: earth[300] }}>{fmt(mrpTotal, currency)}</span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span style={{ color: earth[400] }}>Subtotal ({itemCount} items)</span>
            <span className="font-medium" style={{ color: earth[700] }}>{fmt(subtotal, currency)}</span>
          </div>

          {/* Discount */}
          {discountTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "#16A34A" }}>
                Coupon Discount{promoCode ? ` (${promoCode})` : ""}
              </span>
              <span className="font-medium" style={{ color: "#16A34A" }}>
                -{fmt(discountTotal, currency)}
              </span>
            </div>
          )}

          {/* Gift Card */}
          {giftCardDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "#16A34A" }}>
                Gift Card{giftCardCode ? ` (${giftCardCode})` : ""}
              </span>
              <span className="font-medium" style={{ color: "#16A34A" }}>
                -{fmt(giftCardDiscount, currency)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <span style={{ color: earth[400] }}>Shipping</span>
            <span className="font-medium" style={{ color: shippingFee === 0 ? "#16A34A" : earth[700] }}>
              {shippingFee === 0 ? "Free" : fmt(shippingFee, currency)}
            </span>
          </div>

          {/* Tax */}
          {taxAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: earth[400] }}>Tax (GST)</span>
              <span className="font-medium" style={{ color: earth[700] }}>{fmt(taxAmount, currency)}</span>
            </div>
          )}

          {/* COD handling fee */}
          {effectiveCodFee > 0 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: earth[400] }}>COD handling fee</span>
              <span className="font-medium" style={{ color: earth[700] }}>{fmt(effectiveCodFee, currency)}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="my-4" style={{ borderTop: "1px solid #f0ebe4" }} />

        {/* Grand Total */}
        <div className="flex justify-between items-center">
          <span className="text-base font-bold" style={{ color: earth[700], fontFamily: fonts.heading }}>
            {giftCardDiscount > 0 ? "You Pay" : "Grand Total"}
          </span>
          <span className="text-xl font-bold" style={{ color: primary[500], fontFamily: fonts.heading }}>
            {fmt(payTotal, currency)}
          </span>
        </div>

        {/* Total savings */}
        {totalSavings > 0 && (
          <div
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
            style={{ background: "#F0FDF4" }}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
            <span className="text-xs font-semibold" style={{ color: "#16A34A" }}>
              You save {fmt(totalSavings, currency)} on this order!
            </span>
          </div>
        )}

        {/* Checkout button */}
        {showCheckoutButton && (
          <button
            onClick={onProceedToCheckout}
            disabled={isProcessing || itemCount === 0}
            className="w-full mt-5 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
          >
            {isProcessing ? "Processing..." : "Proceed to Checkout"}
          </button>
        )}

        {/* Trust badges */}
        {showTrustBadges && (
          <div className="flex items-center justify-center gap-4 mt-4">
            {[
              { icon: Shield, label: "Secure" },
              { icon: Truck, label: "Free Shipping" },
              { icon: RefreshCw, label: "Easy Returns" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" style={{ color: earth[300] }} />
                <span className="text-[10px]" style={{ color: earth[300] }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
