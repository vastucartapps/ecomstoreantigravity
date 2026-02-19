"use client"

import { useEffect } from "react"
import { X, ShoppingBag, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCart } from "@/providers/cart-provider"
import { CartLineItem } from "./CartLineItem"
import { EmptyCart } from "./EmptyCart"
import { primary, secondary, earth, bg, fonts, gradients } from "@/lib/theme"

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

function fmt(amount: number, currency: string) {
  return currency === "usd" || currency === "USD"
    ? `$${(amount / 100).toLocaleString("en-US")}`
    : `\u20B9${(amount / 100).toLocaleString("en-IN")}`
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter()
  const { cart, itemCount, updateItem, removeItem } = useCart()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const items = cart?.items || []
  const subtotal = cart?.subtotal ?? 0
  const currency = cart?.currency_code || "inr"
  const currencyDisplay: "INR" | "USD" = currency.toUpperCase() === "USD" ? "USD" : "INR"

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] transition-opacity duration-300"
          style={{ background: "rgba(67, 59, 53, 0.5)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-[85] h-full flex flex-col transition-transform duration-300 ease-out"
        style={{
          width: "100%",
          maxWidth: 440,
          background: bg.primary,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: isOpen ? "-8px 0 30px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* Gradient accent */}
        <div className="h-1 flex-shrink-0" style={{ background: `linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]})` }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid #f0ebe4" }}
        >
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" style={{ color: primary[500] }} />
            <h2 className="text-base font-bold" style={{ color: earth[700], fontFamily: fonts.heading }}>
              Shopping Cart
            </h2>
            {itemCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                style={{ background: secondary[500] }}
              >
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "#f5f0ea" }}
          >
            <X className="w-4 h-4" style={{ color: earth[600] }} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyCart
              compact
              onContinueShopping={() => { onClose(); router.push("/") }}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarWidth: "thin" }}>
              {items.map((item: any) => (
                <CartLineItem
                  key={item.id}
                  id={item.id}
                  productName={item.product_title || item.title || ""}
                  productSlug={item.product?.handle || item.variant?.product?.handle || ""}
                  variantLabel={item.variant_title || item.description || ""}
                  imageUrl={item.thumbnail || ""}
                  price={(item.unit_price || 0) / 100}
                  mrp={(item.compare_at_unit_price || item.unit_price || 0) / 100}
                  currency={currencyDisplay}
                  quantity={item.quantity}
                  maxQuantity={item.variant?.inventory_quantity ?? 99}
                  inStock={true}
                  onUpdateQuantity={(id, qty) => updateItem(id, qty)}
                  onRemove={(id) => removeItem(id)}
                  onViewProduct={(slug) => { onClose(); router.push(`/product/${slug}`) }}
                  compact
                />
              ))}
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-5 py-4"
              style={{ borderTop: "1px solid #f0ebe4", background: bg.card }}
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium" style={{ color: earth[400] }}>Subtotal</span>
                <span className="text-lg font-bold" style={{ color: primary[500], fontFamily: fonts.heading }}>
                  {fmt(subtotal, currency)}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); router.push("/cart") }}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={{ border: `1.5px solid #e8e0d8`, color: earth[600], fontFamily: fonts.body }}
                >
                  View Cart
                </button>
                <button
                  onClick={() => { onClose(); router.push("/checkout") }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
                >
                  Checkout <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
