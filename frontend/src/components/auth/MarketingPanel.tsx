"use client"

import { useState, useEffect } from "react"
import type { MarketingSlide } from "@/types/auth"
import { useBranding } from "@/providers/announcement-provider"

interface MarketingPanelProps {
  slides: MarketingSlide[]
}

export function MarketingPanel({ slides }: MarketingPanelProps) {
  const branding = useBranding()
  const activeSlides = slides
    .filter((s) => s.is_active)
    .sort((a, b) => a.display_order - b.display_order)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    if (activeSlides.length <= 1) return
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentIndex((i) => (i + 1) % activeSlides.length)
        setFade(true)
      }, 600)
    }, 6000)
    return () => clearInterval(interval)
  }, [activeSlides.length])

  const slide = activeSlides[currentIndex] || activeSlides[0]

  // Fallback: solid teal panel with logo when no slides
  if (!slide) {
    return (
      <div
        className="relative h-full w-full flex flex-col items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #013f47, #054348)",
        }}
      >
        <img
          src={branding.logoUrl || "/VastuCartLogo.png"}
          alt={branding.storeName}
          className="h-20 w-auto mb-6 opacity-90"
        />
        <p
          className="text-lg text-white/70 max-w-xs text-center"
          style={{ fontFamily: "'Lora', serif" }}
        >
          Authentic Spiritual Products for Conscious Living
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
        style={{
          backgroundImage: `url(${slide.image_url})`,
          opacity: fade ? 1 : 0,
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(1,63,71,0.55) 0%, rgba(1,63,71,0.82) 60%, rgba(1,63,71,0.95) 100%)",
        }}
      />

      {/* Subtle diamond pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-10 lg:p-14">
        <div />

        {/* Quote */}
        <div
          className="transition-opacity duration-700"
          style={{ opacity: fade ? 1 : 0 }}
        >
          <div
            className="w-10 h-0.5 rounded-full mb-6"
            style={{ background: "linear-gradient(90deg, #c85103, #fd8630)" }}
          />
          <blockquote
            className="text-2xl lg:text-3xl leading-relaxed font-medium"
            style={{ fontFamily: "'Lora', serif", color: "#ffffff" }}
          >
            &ldquo;{slide.quote}&rdquo;
          </blockquote>
          <p
            className="mt-4 text-sm"
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            &mdash; {slide.attribution}
          </p>
        </div>

        {/* Slide indicators */}
        {activeSlides.length > 1 && (
          <div className="flex gap-2">
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFade(false)
                  setTimeout(() => {
                    setCurrentIndex(idx)
                    setFade(true)
                  }, 300)
                }}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: idx === currentIndex ? 32 : 12,
                  background:
                    idx === currentIndex
                      ? "linear-gradient(90deg, #c85103, #fd8630)"
                      : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
