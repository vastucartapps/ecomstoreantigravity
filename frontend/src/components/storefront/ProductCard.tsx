"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Eye, ShoppingBag, Star } from "lucide-react"
import type { StorefrontProduct } from "@/types/storefront"
import { primary, secondary, earth, bg, shadows } from "@/lib/theme"

interface ProductCardProps {
  product: StorefrontProduct
  onProductClick?: (slug: string) => void
  onQuickView?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  isWishlisted?: boolean
}

export function ProductCard({
  product,
  onProductClick,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}: ProductCardProps) {
  const [hovered, setHovered] = useState(false)
  const hasDiscount = product.mrp > product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0

  return (
    <div
      className="group relative rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: bg.card,
        boxShadow: hovered ? shadows.cardHover : shadows.card,
        border: "1px solid #f0ebe4",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden cursor-pointer"
        onClick={() => onProductClick?.(product.slug)}
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500"
          style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-white"
              style={{ background: primary[500] }}
            >
              New
            </span>
          )}
          {hasDiscount && (
            <span
              className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-white"
              style={{ background: secondary[500] }}
            >
              {discountPercent}% Off
            </span>
          )}
          {!product.inStock && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-white bg-stone-500">
              Sold Out
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist?.(product.id)
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
          style={{
            background: isWishlisted ? "#EF4444" : "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
          }}
        >
          <Heart
            className="w-4 h-4 transition-colors"
            style={{ color: isWishlisted ? "#fff" : earth[300] }}
            fill={isWishlisted ? "#fff" : "none"}
          />
        </button>

        {/* Hover actions */}
        <div
          className="absolute bottom-0 left-0 right-0 flex gap-2 p-3 transition-all duration-300"
          style={{
            transform: hovered ? "translateY(0)" : "translateY(100%)",
            opacity: hovered ? 1 : 0,
            background: "linear-gradient(transparent, rgba(0,0,0,0.4))",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              onQuickView?.(product.id)
            }}
            className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
            style={{
              background: "rgba(255,255,255,0.95)",
              color: primary[500],
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            <Eye className="w-3.5 h-3.5" /> Quick View
          </button>
          {product.inStock && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToCart?.(product.id)
              }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 text-white transition-all"
              style={{
                background: primary[500],
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3
          className="text-sm font-medium leading-tight line-clamp-2 cursor-pointer transition-colors"
          style={{ color: earth[700], fontFamily: "'Open Sans', sans-serif" }}
          onClick={() => onProductClick?.(product.slug)}
          onMouseEnter={(e) => (e.currentTarget.style.color = primary[500])}
          onMouseLeave={(e) => (e.currentTarget.style.color = earth[700])}
        >
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-3 h-3"
                  fill={
                    star <= Math.round(product.rating) ? "#F59E0B" : "none"
                  }
                  stroke={
                    star <= Math.round(product.rating) ? "#F59E0B" : "#d1c9c0"
                  }
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span
              className="text-[11px]"
              style={{
                color: earth[300],
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-2">
          <span
            className="text-base font-bold"
            style={{
              color: primary[500],
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            {product.currency === "USD" ? "$" : "₹"}
            {product.price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span
              className="text-xs line-through"
              style={{
                color: earth[300],
                fontFamily: "'Open Sans', sans-serif",
              }}
            >
              {product.currency === "USD" ? "$" : "₹"}
              {product.mrp.toLocaleString()}
            </span>
          )}
        </div>

        {/* Variant count */}
        {product.variantCount > 1 && (
          <p
            className="mt-1.5 text-[11px]"
            style={{
              color: earth[300],
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            {product.variantCount} variants available
          </p>
        )}
      </div>
    </div>
  )
}
