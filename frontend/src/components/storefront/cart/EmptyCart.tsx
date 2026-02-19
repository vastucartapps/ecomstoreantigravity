"use client"

import { ShoppingBag } from "lucide-react"
import { primary, earth, bg, fonts } from "@/lib/theme"

interface EmptyCartProps {
  title?: string
  description?: string
  ctaLabel?: string
  onContinueShopping?: () => void
  compact?: boolean
}

export function EmptyCart({
  title = "Your cart is empty",
  description = "Looks like you haven't added any sacred treasures yet. Explore our collection and find the perfect piece for your space.",
  ctaLabel = "Start Shopping",
  onContinueShopping,
  compact = false,
}: EmptyCartProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "py-10 px-6" : "py-20 px-6"}`}>
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
        style={{ background: primary[50] }}
      >
        <ShoppingBag className="w-9 h-9" style={{ color: primary[500] }} />
      </div>
      <h2
        className={`font-bold mb-2 ${compact ? "text-lg" : "text-2xl"}`}
        style={{ color: earth[700], fontFamily: fonts.heading }}
      >
        {title}
      </h2>
      <p
        className="text-sm max-w-sm mb-6"
        style={{ color: earth[400], fontFamily: fonts.body }}
      >
        {description}
      </p>
      <button
        onClick={onContinueShopping}
        className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}
