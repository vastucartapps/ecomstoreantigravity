"use client"

import { useEffect, useState } from "react"
import { Truck, Zap, ArrowLeft, ArrowRight, MapPin, Calendar } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useCart } from "@/providers/cart-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { useOperationalPolicies } from "@/providers/announcement-provider"
import { primary, earth, bg, fonts, semantic } from "@/lib/theme"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

interface DeliveryEstimate {
  id: string
  region: string
  pincodePrefix: string
  minDays: number
  maxDays: number
}

interface CodConfig {
  enabled: boolean
  fee: number
  minOrder: number
  maxOrder: number
}

function addDays(date: Date, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function matchEstimate(
  pincode: string,
  estimates: DeliveryEstimate[]
): { standard: DeliveryEstimate | null; express: DeliveryEstimate | null } {
  const standardCandidates = estimates.filter(
    (e) => !e.region.toLowerCase().includes("express")
  )
  const expressCandidates = estimates.filter((e) =>
    e.region.toLowerCase().includes("express")
  )

  const matchByPrefix = (candidates: DeliveryEstimate[]) => {
    if (!pincode) return candidates[0] || null
    for (const e of candidates) {
      if (!e.pincodePrefix) continue
      const prefixes = e.pincodePrefix.split(",").map((p) => p.trim())
      if (prefixes.some((p) => pincode.startsWith(p))) return e
    }
    // fallback to first with no prefix requirement
    return candidates.find((e) => !e.pincodePrefix) || candidates[0] || null
  }

  return {
    standard: matchByPrefix(standardCandidates),
    express: matchByPrefix(expressCandidates),
  }
}

export function ShippingStep() {
  const { user } = useAuth()
  const { cart } = useCart()
  const {
    shippingOptions,
    selectedShippingId,
    loadShippingOptions,
    applyShippingMethod,
    setStep,
    codEnabled,
    toggleCod,
    goBack,
    isProcessing,
    error,
  } = useCheckout()

  // COD limits come from the operational-policies hook (single source of
  // truth) — same data the trust ribbon, refund-policy, and admin
  // ShippingConfig consume. The local state is initialised from the hook so
  // first paint shows the live admin values, not hardcoded 500/25000 that
  // used to drift after admin edits.
  const opsPolicies = useOperationalPolicies()
  const [localSelected, setLocalSelected] = useState<string>(selectedShippingId || "")
  const [codConfig, setCodConfig] = useState<CodConfig>({
    enabled: opsPolicies.codEnabled,
    fee: opsPolicies.codFee,
    minOrder: opsPolicies.codMinOrderInr,
    maxOrder: opsPolicies.codMaxOrderInr,
  })
  const [deliveryEstimates, setDeliveryEstimates] = useState<DeliveryEstimate[]>([])
  const [pincode, setPincode] = useState("")
  const [pincodeSubmitted, setPincodeSubmitted] = useState(false)

  useEffect(() => {
    loadShippingOptions()
  }, [])

  // Keep local codConfig synced with hook updates (admin edits propagate
  // via the 15s revalidation in the announcement provider).
  useEffect(() => {
    setCodConfig({
      enabled: opsPolicies.codEnabled,
      fee: opsPolicies.codFee,
      minOrder: opsPolicies.codMinOrderInr,
      maxOrder: opsPolicies.codMaxOrderInr,
    })
  }, [opsPolicies.codEnabled, opsPolicies.codFee, opsPolicies.codMinOrderInr, opsPolicies.codMaxOrderInr])

  // Fetch only what's NOT in the operational-policies hook: delivery
  // estimates by pincode (those still live in the raw shipping-config
  // response because they're a heavier data shape than the hook exposes).
  useEffect(() => {
    fetch(`${BACKEND_URL}/store/shipping-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.config?.deliveryEstimates) setDeliveryEstimates(data.config.deliveryEstimates)
      })
      .catch(() => {})
  }, [])

  // Auto-select first option when options load and apply it to cart
  useEffect(() => {
    if (shippingOptions.length > 0 && !localSelected && !selectedShippingId) {
      handleSelectOption(shippingOptions[0].id)
    }
  }, [shippingOptions])

  const grandTotal = (cart?.total || 0) / 100
  const shippingAddress = cart?.shipping_address
  const isIndian =
    !shippingAddress?.country_code || shippingAddress.country_code === "in"

  const codEligible =
    !!user &&
    isIndian &&
    codConfig.enabled &&
    grandTotal >= codConfig.minOrder &&
    grandTotal <= codConfig.maxOrder

  // Clicking a shipping option applies it to the cart immediately (live total update).
  const handleSelectOption = async (optionId: string) => {
    setLocalSelected(optionId)
    await applyShippingMethod(optionId)
  }

  const handleContinue = () => {
    if (!selectedShippingId && !localSelected) return
    setStep("payment")
  }

  const formatPrice = (amount: number) =>
    amount === 0 ? "Free" : `₹${(amount / 100).toLocaleString("en-IN")}`

  // Delivery estimate display
  const today = new Date()
  const isValidPincode = pincode.length === 6 && /^\d{6}$/.test(pincode)
  const estimateMatch =
    isIndian && pincodeSubmitted && isValidPincode
      ? matchEstimate(pincode, deliveryEstimates)
      : null

  return (
    <div className="space-y-4">
      {/* Shipping options */}
      <div className="space-y-2.5">
        {shippingOptions.map((option) => {
          const isSelected = localSelected === option.id
          const isExpress = option.name.toLowerCase().includes("express")
          return (
            <label
              key={option.id}
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: `1.5px solid ${isSelected ? primary[500] : "#e8e0d8"}`,
                background: isSelected ? primary[50] : bg.card,
              }}
              onClick={() => handleSelectOption(option.id)}
            >
              <input
                type="radio"
                name="shipping"
                value={option.id}
                checked={isSelected}
                onChange={() => handleSelectOption(option.id)}
                className="flex-shrink-0"
                style={{ accentColor: primary[500] }}
              />
              <div className="flex-1 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isExpress ? (
                    <Zap className="w-4 h-4 flex-shrink-0" style={{ color: primary[500] }} />
                  ) : (
                    <Truck
                      className="w-4 h-4 flex-shrink-0"
                      style={{ color: earth[400] }}
                    />
                  )}
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: earth[700], fontFamily: fonts.body }}
                    >
                      {option.name}
                    </p>
                    <p className="text-xs" style={{ color: earth[400] }}>
                      {isExpress ? "2–3 business days" : "5–7 business days"}
                    </p>
                  </div>
                </div>
                <span
                  className="text-sm font-bold ml-4"
                  style={{ color: option.amount === 0 ? semantic.success : earth[700] }}
                >
                  {formatPrice(option.amount)}
                </span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Delivery Estimate Widget */}
      {isIndian && deliveryEstimates.length > 0 && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{ background: primary[50], border: `1px solid ${primary[100]}` }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" style={{ color: primary[500] }} />
            <p className="text-sm font-semibold" style={{ color: earth[700] }}>
              Check Delivery Estimate
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => {
                setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                setPincodeSubmitted(false)
              }}
              placeholder="Enter 6-digit pincode"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                border: `1px solid ${primary[200]}`,
                fontFamily: fonts.body,
                color: earth[700],
              }}
            />
            <button
              onClick={() => {
                if (isValidPincode) setPincodeSubmitted(true)
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: primary[500] }}
            >
              Check
            </button>
          </div>

          {pincodeSubmitted && isValidPincode && (
            <div className="space-y-1.5 pt-1">
              {estimateMatch?.standard && (
                <div className="flex items-center gap-2 text-xs" style={{ color: earth[600] }}>
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: earth[400] }} />
                  <span>
                    <strong>Standard:</strong> Arrives by{" "}
                    {addDays(today, estimateMatch.standard.maxDays)} –{" "}
                    {estimateMatch.standard.minDays}–{estimateMatch.standard.maxDays} days
                  </span>
                </div>
              )}
              {estimateMatch?.express && (
                <div className="flex items-center gap-2 text-xs" style={{ color: earth[600] }}>
                  <Zap className="w-3.5 h-3.5 flex-shrink-0" style={{ color: primary[500] }} />
                  <span>
                    <strong>Express:</strong> Arrives by{" "}
                    {addDays(today, estimateMatch.express.maxDays)} –{" "}
                    {estimateMatch.express.minDays}–{estimateMatch.express.maxDays} days
                  </span>
                </div>
              )}
              {!estimateMatch?.standard && !estimateMatch?.express && (
                <p className="text-xs" style={{ color: earth[400] }}>
                  Delivery estimate not available for this pincode.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* International estimate */}
      {!isIndian && (
        <div
          className="p-4 rounded-xl"
          style={{ background: primary[50], border: `1px solid ${primary[100]}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4" style={{ color: primary[500] }} />
            <p className="text-sm font-semibold" style={{ color: earth[700] }}>
              International Delivery Estimate
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs" style={{ color: earth[600] }}>
              <strong>Standard:</strong> {addDays(today, 15)} – {addDays(today, 30)} (15–30 business days)
            </p>
            <p className="text-xs" style={{ color: earth[600] }}>
              <strong>Express:</strong> {addDays(today, 10)} – {addDays(today, 20)} (10–20 business days)
            </p>
          </div>
        </div>
      )}

      {/* COD toggle */}
      {codEligible && (
        <div className="p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A" }}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={codEnabled}
              onChange={(e) => toggleCod(e.target.checked)}
              className="mt-0.5 flex-shrink-0"
              style={{ accentColor: primary[500] }}
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: earth[700] }}>
                Cash on Delivery
                {codConfig.fee > 0 && (
                  <span
                    className="ml-2 text-xs font-normal"
                    style={{ color: earth[400] }}
                  >
                    (+₹{codConfig.fee} COD fee)
                  </span>
                )}
              </p>
              <p className="text-xs mt-0.5" style={{ color: earth[400] }}>
                Pay when your order arrives. Available for orders ₹
                {codConfig.minOrder.toLocaleString("en-IN")}–₹
                {codConfig.maxOrder.toLocaleString("en-IN")}.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* COD not available note */}
      {!codEligible && !!user && isIndian && codConfig.enabled && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{ color: earth[400], background: "#f9f6f2" }}
        >
          COD available for orders ₹{codConfig.minOrder.toLocaleString("en-IN")}–₹
          {codConfig.maxOrder.toLocaleString("en-IN")}
        </p>
      )}

      {error && (
        <p
          className="text-sm px-4 py-2.5 rounded-lg"
          style={{ color: "#EF4444", background: "#FEF2F2" }}
        >
          {error}
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
          onClick={handleContinue}
          disabled={isProcessing || !localSelected}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
        >
          {isProcessing ? (
            "Saving..."
          ) : (
            <>
              Continue to Payment <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
