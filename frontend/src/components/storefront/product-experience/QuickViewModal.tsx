"use client"

import { useState, useEffect } from "react"
import { X, Star, ShoppingCart, Minus, Plus, Eye } from "lucide-react"
import type { QuickViewProps, SwatchValue } from "@/types/product-experience"
import { VariantSelector } from "./VariantSelector"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"

export function QuickViewModal({
  product,
  images,
  variants,
  variantAttributes,
  isOpen,
  onClose,
  onAddToCart,
  onViewFullDetails,
  onVariantChange,
}: QuickViewProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState(variants[0])
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const attr of variantAttributes) {
      const val = variants[0]?.attributes[attr.name]
      if (val) init[attr.name] = val
    }
    return init
  })
  const [activeImageIdx, setActiveImageIdx] = useState(0)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setQuantity(1)
      setActiveImageIdx(0)
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const handleVariantSelect = (attrName: string, value: string) => {
    const next = { ...selectedValues, [attrName]: value }
    setSelectedValues(next)
    const match = variants.find((v) =>
      Object.entries(next).every(([k, val]) => v.attributes[k] === val)
    )
    if (match) {
      setSelectedVariant(match)
      onVariantChange?.(match.id)
    }
  }

  if (!isOpen) return null

  const sorted = [...images].sort((a, b) => a.order - b.order)
  const activeImage = sorted[activeImageIdx] || sorted[0]
  const discountPercent = selectedVariant
    ? Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100)
    : product.discountPercent

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: bg.card }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "#f5f0ea" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#ebe3d9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#f5f0ea")}
        >
          <X className="w-4 h-4" style={{ color: earth[600] }} />
        </button>

        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-1/2 p-5">
            <div className="aspect-square rounded-xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
              {activeImage && (
                <img
                  src={activeImage.url}
                  alt={activeImage.alt || product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {sorted.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {sorted.slice(0, 5).map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIdx(idx)}
                    className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                    style={{
                      border: idx === activeImageIdx ? `2px solid ${primary[500]}` : "2px solid #f0ebe4",
                      opacity: idx === activeImageIdx ? 1 : 0.6,
                    }}
                  >
                    <img src={img.url} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="sm:w-1/2 p-5 sm:pl-2">
            <h2 className="text-xl font-bold leading-snug pr-8" style={{ color: earth[700], fontFamily: fonts.heading }}>
              {product.name}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5"
                    fill={s <= Math.round(product.rating) ? "#F59E0B" : "none"}
                    stroke={s <= Math.round(product.rating) ? "#F59E0B" : "#d1c9c0"}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: earth[400] }}>
                ({product.reviewCount})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2.5 mt-4">
              <span className="text-2xl font-bold" style={{ color: primary[500], fontFamily: fonts.heading }}>
                {product.currency === "USD" ? "$" : "\u20B9"}{(selectedVariant?.price ?? product.price).toLocaleString()}
              </span>
              {(selectedVariant?.mrp ?? product.mrp) > (selectedVariant?.price ?? product.price) && (
                <>
                  <span className="text-sm line-through" style={{ color: earth[300] }}>
                    {product.currency === "USD" ? "$" : "\u20B9"}{(selectedVariant?.mrp ?? product.mrp).toLocaleString()}
                  </span>
                  {discountPercent > 0 && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: secondary[500] }}
                    >
                      {discountPercent}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Variants */}
            {variantAttributes.length > 0 && (
              <div className="mt-4">
                <VariantSelector
                  attributes={variantAttributes}
                  selectedValues={selectedValues}
                  onSelect={handleVariantSelect}
                />
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid #e8e0d8" }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2.5 transition-colors"
                  style={{ color: earth[400] }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0ea")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span
                  className="px-3 py-2.5 text-sm font-semibold min-w-[36px] text-center"
                  style={{ color: earth[700], fontFamily: fonts.body }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2.5 transition-colors"
                  style={{ color: earth[400] }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f0ea")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => onAddToCart?.(selectedVariant?.id || "", quantity)}
                disabled={!selectedVariant?.inStock}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                style={{ background: primary[500], fontFamily: fonts.body }}
                onMouseEnter={(e) => { if (selectedVariant?.inStock) e.currentTarget.style.background = primary[400] }}
                onMouseLeave={(e) => (e.currentTarget.style.background = primary[500])}
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>

            {/* View Full Details */}
            <button
              onClick={() => onViewFullDetails?.(product.slug)}
              className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{ border: `1.5px solid #e8e0d8`, color: earth[600], fontFamily: fonts.body }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = primary[400]; e.currentTarget.style.color = primary[500] }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e0d8"; e.currentTarget.style.color = earth[600] }}
            >
              <Eye className="w-4 h-4" /> View Full Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
