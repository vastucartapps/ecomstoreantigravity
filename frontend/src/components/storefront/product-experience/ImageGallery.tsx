"use client"

import { useState, useRef, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react"
import type { ProductImage } from "@/types/product-experience"
import { primary, earth, bg, fonts, gradients } from "@/lib/theme"

interface ImageGalleryProps {
  images: ProductImage[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const thumbRef = useRef<HTMLDivElement>(null)

  const sorted = [...images].sort((a, b) => a.order - b.order)
  const active = sorted[activeIdx] || sorted[0]

  const go = useCallback(
    (dir: "prev" | "next") => {
      setActiveIdx((i) =>
        dir === "prev"
          ? (i - 1 + sorted.length) % sorted.length
          : (i + 1) % sorted.length
      )
    },
    [sorted.length]
  )

  if (!sorted.length) {
    return (
      <div
        className="aspect-square rounded-2xl flex items-center justify-center"
        style={{ background: "#f5f0ea" }}
      >
        <span className="text-sm" style={{ color: earth[300], fontFamily: fonts.body }}>
          No images available
        </span>
      </div>
    )
  }

  return (
    <>
      {/* Main image */}
      <div className="relative group">
        <div
          className="relative aspect-square rounded-2xl overflow-hidden cursor-zoom-in"
          style={{ border: "1px solid #f0ebe4" }}
          onClick={() => setLightboxOpen(true)}
        >
          <Image
            src={active.url}
            alt={active.alt || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          {/* Zoom hint */}
          <div
            className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(1,63,71,0.75)", fontFamily: fonts.body }}
          >
            <ZoomIn className="w-3.5 h-3.5" /> Click to zoom
          </div>
        </div>

        {/* Prev/Next arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); go("prev") }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #f0ebe4" }}
            >
              <ChevronLeft className="w-5 h-5" style={{ color: earth[600] }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); go("next") }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #f0ebe4" }}
            >
              <ChevronRight className="w-5 h-5" style={{ color: earth[600] }} />
            </button>
          </>
        )}

        {/* Image counter badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.9)", color: earth[600], fontFamily: fonts.body }}
        >
          {activeIdx + 1} / {sorted.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {sorted.length > 1 && (
        <div className="mt-4 relative">
          <div ref={thumbRef} className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIdx(idx)}
                className="w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200"
                style={{
                  border: idx === activeIdx ? `2px solid ${primary[500]}` : "2px solid #f0ebe4",
                  opacity: idx === activeIdx ? 1 : 0.65,
                }}
              >
                <Image src={img.url} alt={img.alt || ""} width={72} height={72} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); go("prev") }}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative rounded-lg overflow-hidden"
            style={{ maxHeight: "85vh", maxWidth: "90vw", width: "70vw", height: "70vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={active.url}
              alt={active.alt || ""}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); go("next") }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Bottom thumbnails in lightbox */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(idx) }}
                className="w-14 h-14 rounded-lg overflow-hidden transition-all"
                style={{
                  border: idx === activeIdx ? "2px solid white" : "2px solid transparent",
                  opacity: idx === activeIdx ? 1 : 0.5,
                }}
              >
                <Image src={img.url} alt="" width={56} height={56} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
