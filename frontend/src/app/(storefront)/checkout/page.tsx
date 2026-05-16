"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Lock } from "lucide-react"
import { useCart } from "@/providers/cart-provider"
import { CheckoutProvider, useCheckout } from "@/providers/checkout-provider"
import { useBranding } from "@/providers/announcement-provider"
import { OrderSummary } from "@/components/storefront/cart/OrderSummary"
import {
  StepIndicator,
  ContactStep,
  AddressStep,
  ShippingStep,
  PaymentStep,
} from "@/components/storefront/checkout"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"
import type { CheckoutStepId } from "@/types/checkout"

const STEP_META: { id: CheckoutStepId; label: string }[] = [
  { id: "contact", label: "Contact" },
  { id: "address", label: "Address" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
]

function CheckoutContent() {
  const router = useRouter()
  const branding = useBranding()
  const { cart, isLoading } = useCart()
  const {
    step,
    goToStep,
    completedOrderId,
    appliedGiftCard,
    giftCardDiscount,
    paymentMethod,
    codConfig,
  } = useCheckout()

  const items = cart?.items || []
  const hasItems = items.length > 0

  // Only redirect to /cart if the cart is genuinely empty AND no order has been
  // placed in this session. completedOrderId is set by completeCheckout() before
  // navigation begins, so this guard never fires during the route transition
  // (even if clearCart() on the order-confirmation page empties the cart while
  // this page is still mounted).
  useEffect(() => {
    if (!isLoading && !hasItems && !completedOrderId) {
      router.replace("/cart")
    }
  }, [isLoading, hasItems, completedOrderId])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: bg.primary }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: primary[500] }} />
      </div>
    )
  }

  if (!hasItems && !completedOrderId) return null

  const subtotal = (cart?.subtotal || 0) / 100
  const mrpTotal = items.reduce((sum: number, item: any) => {
    return sum + (item.compare_at_unit_price || item.unit_price || 0) / 100 * item.quantity
  }, 0)
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmount = (cart?.tax_total || 0) / 100
  const discountTotal = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const itemCount = items.reduce((sum: number, i: any) => sum + i.quantity, 0)

  const currentStepIdx = STEP_META.findIndex((s) => s.id === step)
  const steps = STEP_META.map((s, idx) => ({
    id: s.id,
    label: s.label,
    status: idx < currentStepIdx ? "completed" : idx === currentStepIdx ? "active" : "upcoming",
  })) as { id: CheckoutStepId; label: string; status: "completed" | "active" | "upcoming" }[]

  const stepComponents: Record<CheckoutStepId, React.ReactNode> = {
    contact: <ContactStep />,
    address: <AddressStep />,
    shipping: <ShippingStep />,
    payment: <PaymentStep />,
  }

  const stepTitles: Record<CheckoutStepId, string> = {
    contact: "Contact Information",
    address: "Delivery Address",
    shipping: "Shipping Method",
    payment: "Payment",
  }

  return (
    <div className="min-h-screen" style={{ background: bg.primary }}>
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: "#f0ebe4", background: bg.card }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg" style={{ color: primary[500], fontFamily: fonts.heading }}>
            {branding.storeName}
          </span>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: earth[400] }}>
            <Lock className="w-3.5 h-3.5" />
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Step indicator */}
        <div className="mb-6">
          <StepIndicator steps={steps} onGoToStep={(id) => goToStep(id as CheckoutStepId)} />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main step content */}
          <div className="flex-1">
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
              {/* Step header */}
              <div className="flex items-center gap-2 mb-5 pb-4" style={{ borderBottom: "1px solid #f0ebe4" }}>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}
                >
                  {currentStepIdx + 1}
                </div>
                <h2 className="text-base font-bold" style={{ color: earth[700], fontFamily: fonts.heading }}>
                  {stepTitles[step]}
                </h2>
              </div>

              {stepComponents[step]}
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
              {["100% Secure", "Easy Returns", "Genuine Products"].map((badge) => (
                <div key={badge} className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: earth[300] }} />
                  <span className="text-xs" style={{ color: earth[300] }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-6">
              <OrderSummary
                subtotal={subtotal}
                mrpTotal={mrpTotal}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                discountTotal={discountTotal}
                grandTotal={grandTotal}
                currency="INR"
                itemCount={itemCount}
                giftCardDiscount={giftCardDiscount / 100}
                giftCardCode={appliedGiftCard?.code}
                codFee={codConfig?.fee || 0}
                codSelected={paymentMethod === "cod"}
                showCheckoutButton={false}
                showTrustBadges={false}
              />

              {/* Items preview */}
              <div className="mt-3 rounded-2xl overflow-hidden" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0ebe4" }}>
                  <p className="text-xs font-semibold" style={{ color: earth[500] }}>
                    {itemCount} item{itemCount > 1 ? "s" : ""} in cart
                  </p>
                </div>
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-2.5">
                      {item.thumbnail ? (
                        <img src={normalizeImageUrl(item.thumbnail)} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ background: "#f0ebe4" }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: earth[700] }}>
                          {item.product_title || item.title}
                        </p>
                        <p className="text-xs" style={{ color: earth[400] }}>
                          Qty: {item.quantity} · ₹{((item.unit_price || 0) / 100).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <CheckoutProvider>
      <CheckoutContent />
    </CheckoutProvider>
  )
}
