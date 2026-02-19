"use client"

import { useState } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"

interface CartLineItemProps {
  id: string
  productName: string
  productSlug: string
  variantLabel: string
  imageUrl: string
  price: number
  mrp: number
  currency: "INR" | "USD"
  quantity: number
  maxQuantity: number
  inStock: boolean
  onUpdateQuantity?: (id: string, quantity: number) => void
  onRemove?: (id: string) => void
  onViewProduct?: (slug: string) => void
  compact?: boolean
}

function formatPrice(amount: number, currency: "INR" | "USD") {
  return currency === "INR"
    ? `\u20B9${amount.toLocaleString("en-IN")}`
    : `$${amount.toLocaleString("en-US")}`
}

export function CartLineItem({
  id,
  productName,
  productSlug,
  variantLabel,
  imageUrl,
  price,
  mrp,
  currency,
  quantity,
  maxQuantity,
  inStock,
  onUpdateQuantity,
  onRemove,
  onViewProduct,
  compact = false,
}: CartLineItemProps) {
  const [removing, setRemoving] = useState(false)
  const hasDiscount = mrp > price
  const lineTotal = price * quantity

  const handleRemove = () => {
    setRemoving(true)
    setTimeout(() => onRemove?.(id), 300)
  }

  const imgSize = compact ? "w-16 h-16" : "w-20 h-20"

  return (
    <div
      className={`flex gap-3 py-4 transition-all duration-300 ${removing ? "opacity-0 -translate-x-4" : "opacity-100"}`}
      style={{ borderBottom: "1px solid #f0ebe4" }}
    >
      {/* Image */}
      <div
        className={`${imgSize} rounded-lg overflow-hidden flex-shrink-0 cursor-pointer`}
        style={{ border: "1px solid #f0ebe4" }}
        onClick={() => onViewProduct?.(productSlug)}
      >
        <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-medium leading-snug line-clamp-2 cursor-pointer transition-colors hover:text-[${primary[500]}] ${compact ? "text-xs" : "text-sm"}`}
          style={{ color: earth[700], fontFamily: fonts.body }}
          onClick={() => onViewProduct?.(productSlug)}
        >
          {productName}
        </h4>
        {variantLabel && variantLabel !== "Default" && (
          <p className="text-xs mt-0.5" style={{ color: earth[400] }}>
            {variantLabel}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`} style={{ color: primary[500] }}>
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: earth[300] }}>
              {formatPrice(mrp, currency)}
            </span>
          )}
        </div>

        {!inStock && (
          <p className="text-xs font-medium mt-1" style={{ color: "#EF4444" }}>
            Out of stock
          </p>
        )}

        {/* Quantity + Remove */}
        <div className="flex items-center justify-between mt-2">
          <div
            className="flex items-center rounded-lg overflow-hidden"
            style={{ border: "1px solid #e8e0d8" }}
          >
            <button
              onClick={() => onUpdateQuantity?.(id, Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-2 py-1.5 transition-colors disabled:opacity-30"
              style={{ color: earth[400] }}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span
              className="px-2.5 py-1.5 text-xs font-semibold min-w-[28px] text-center"
              style={{ color: earth[700], fontFamily: fonts.body }}
            >
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity?.(id, Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
              className="px-2 py-1.5 transition-colors disabled:opacity-30"
              style={{ color: earth[400] }}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className={`font-bold ${compact ? "text-xs" : "text-sm"}`} style={{ color: earth[700] }}>
              {formatPrice(lineTotal, currency)}
            </span>
            <button
              onClick={handleRemove}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ color: earth[300] }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "#FEF2F2" }}
              onMouseLeave={(e) => { e.currentTarget.style.color = earth[300]; e.currentTarget.style.background = "transparent" }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
