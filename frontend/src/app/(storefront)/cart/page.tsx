"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/providers/cart-provider"
import { trackViewCart, mapLineItems, cartTotalMajor, onceInSession } from "@/lib/analytics/events"
import { CartLineItem } from "@/components/storefront/cart/CartLineItem"
import { OrderSummary } from "@/components/storefront/cart/OrderSummary"
import { CouponInput } from "@/components/storefront/cart/CouponInput"
import { EmptyCart } from "@/components/storefront/cart/EmptyCart"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"

export default function CartPage() {
  const router = useRouter()
  const { cart, updateItem, removeItem, applyPromoCode, removePromoCode, isLoading, appliedGiftCard, giftCardDiscount } = useCart()
  const [couponError, setCouponError] = useState<string | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const items = cart?.items || []
  const currency = cart?.currency_code?.toUpperCase() === "USD" ? "USD" : "INR"

  // GA4 view_cart — fires once per cart state when items are present.
  // Session-scoped dedupe keys include the cart id so a changed cart re-fires.
  useEffect(() => {
    if (!cart?.id || !items.length) return
    onceInSession(`view_cart:${cart.id}:${items.length}`, () => {
      const { value, currency: cur } = cartTotalMajor(cart)
      trackViewCart({ items: mapLineItems(items, cur), currency: cur, value })
    })
  }, [cart, items.length])

  // Map Medusa cart to display
  const subtotal = (cart?.subtotal || 0) / 100
  const mrpTotal = items.reduce((sum: number, item: any) => {
    const mrp = (item.compare_at_unit_price || item.unit_price || 0) / 100
    return sum + mrp * item.quantity
  }, 0)
  const shippingFee = (cart?.shipping_total || 0) / 100
  const taxAmount = (cart?.tax_total || 0) / 100
  const discountTotal = (cart?.discount_total || 0) / 100
  const grandTotal = (cart?.total || 0) / 100
  const itemCount = items.reduce((sum: number, i: any) => sum + i.quantity, 0)

  // Applied coupon from promo_codes
  const appliedPromos = cart?.promotions || []
  const appliedCoupon = appliedPromos.length > 0 ? {
    code: appliedPromos[0]?.code || "",
    discountAmount: discountTotal,
    description: appliedPromos[0]?.description || "Discount applied",
  } : null

  const handleApplyCoupon = async (code: string) => {
    setCouponError(null)
    setCouponLoading(true)
    try {
      await applyPromoCode(code)
    } catch (err: any) {
      setCouponError(err?.message || "Invalid coupon code. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = async () => {
    if (!appliedCoupon?.code) return
    try {
      await removePromoCode(appliedCoupon.code)
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: bg.primary }}>
        <div className="animate-spin w-8 h-8 rounded-full border-2 border-transparent" style={{ borderTopColor: primary[500] }} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" style={{ background: bg.primary }}>
        <EmptyCart onContinueShopping={() => router.push("/")} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: bg.primary }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-6 h-6" style={{ color: primary[500] }} />
          <h1 className="text-2xl font-bold" style={{ color: earth[700], fontFamily: fonts.heading }}>
            Shopping Cart
          </h1>
          <span
            className="px-2.5 py-0.5 rounded-full text-sm font-bold text-white"
            style={{ background: primary[500] }}
          >
            {itemCount}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items list */}
          <div className="flex-1">
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: bg.card, border: "1px solid #f0ebe4" }}
            >
              <div className="px-5">
                {items.map((item: any) => (
                  <CartLineItem
                    key={item.id}
                    id={item.id}
                    productName={item.product_title || item.title || ""}
                    productSlug={item.variant?.product?.handle || item.product?.handle || ""}
                    variantLabel={item.variant_title || item.description || ""}
                    imageUrl={normalizeImageUrl(item.thumbnail)}
                    price={(item.unit_price || 0) / 100}
                    mrp={(item.compare_at_unit_price || item.unit_price || 0) / 100}
                    currency={currency}
                    quantity={item.quantity}
                    maxQuantity={item.variant?.manage_inventory ? (item.variant?.inventory_quantity || 1) : 99}
                    inStock={!item.variant?.manage_inventory || (item.variant?.inventory_quantity || 0) > 0}
                    onUpdateQuantity={(id, qty) => updateItem(id, qty)}
                    onRemove={(id) => removeItem(id)}
                    onViewProduct={(slug) => router.push(`/product/${slug}`)}
                  />
                ))}
              </div>

              {/* Continue shopping */}
              <div className="px-5 py-4" style={{ borderTop: "1px solid #f0ebe4" }}>
                <button
                  onClick={() => router.push("/")}
                  className="text-sm font-medium transition-colors"
                  style={{ color: primary[500] }}
                >
                  ← Continue Shopping
                </button>
              </div>
            </div>

            {/* Coupon section (mobile: below items) */}
            <div className="mt-4 lg:hidden rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: earth[700] }}>Have a coupon?</h3>
              <CouponInput
                appliedCoupon={appliedCoupon}
                currency={currency}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                isLoading={couponLoading}
                error={couponError}
              />
            </div>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:w-96 flex-shrink-0">
            {/* Coupon (desktop) */}
            <div className="mb-4 hidden lg:block rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: earth[700] }}>Have a coupon?</h3>
              <CouponInput
                appliedCoupon={appliedCoupon}
                currency={currency}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                isLoading={couponLoading}
                error={couponError}
              />
            </div>

            <div className="lg:sticky lg:top-24">
              <OrderSummary
                subtotal={subtotal}
                mrpTotal={mrpTotal}
                shippingFee={shippingFee}
                taxAmount={taxAmount}
                discountTotal={discountTotal}
                grandTotal={grandTotal}
                currency={currency}
                itemCount={itemCount}
                promoCode={appliedCoupon?.code}
                giftCardDiscount={giftCardDiscount / 100}
                giftCardCode={appliedGiftCard?.code}
                onProceedToCheckout={() => router.push("/checkout")}
                showCheckoutButton
                showTrustBadges
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
