"use client"

import { Check, X } from "lucide-react"
import type { RichContentBlock } from "@/types/product-experience"
import { primary, secondary, earth, bg, fonts, gradients } from "@/lib/theme"

interface RichContentProps {
  blocks: RichContentBlock[]
}

const divider = (
  <div
    style={{
      height: 1,
      background: "linear-gradient(90deg, transparent, #e8e2da 30%, #e8e2da 70%, transparent)",
      margin: "32px 0",
    }}
  />
)

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
      <h3
        className="text-xl sm:text-2xl font-bold text-center px-4"
        style={{ color: earth[700], fontFamily: fonts.heading }}
      >
        {title}
      </h3>
      <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
    </div>
  )
}

export function RichContent({ blocks }: RichContentProps) {
  return (
    <div>
      {blocks.map((block, blockIdx) => {
        switch (block.type) {
          // ── HERO ─────────────────────────────────────────────────────────────
          case "hero":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                {block.title && <SectionTitle title={block.title} />}
                {/* 970:400 = 97:40 — standard hero image ratio */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-lg"
                  style={{ aspectRatio: "97/40" }}
                >
                  <img
                    src={block.imageUrl}
                    alt={block.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 40%, rgba(1,63,71,0.85) 100%)",
                    }}
                  />
                  {block.headline && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                      <h4
                        className="text-xl sm:text-2xl font-bold text-white"
                        style={{ fontFamily: fonts.heading }}
                      >
                        {block.headline}
                      </h4>
                      {block.description && (
                        <p
                          className="mt-2 text-sm text-white/80 leading-relaxed"
                          style={{ fontFamily: fonts.body }}
                        >
                          {block.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {/* description below if not shown in overlay */}
                {block.description && !block.headline && (
                  <p
                    className="mt-6 text-sm sm:text-base leading-relaxed"
                    style={{ color: earth[600], fontFamily: fonts.body, lineHeight: 1.8 }}
                  >
                    {block.description}
                  </p>
                )}
              </div>
            )

          // ── COMPARISON TABLE ─────────────────────────────────────────────────
          case "comparison":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
                  <h3
                    className="text-xl sm:text-2xl font-bold text-center px-4"
                    style={{ color: earth[700], fontFamily: fonts.heading }}
                  >
                    {block.title}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
                </div>

                <div
                  className="rounded-2xl overflow-hidden overflow-x-auto shadow-sm"
                  style={{ border: "1px solid #f0ebe4" }}
                >
                  <div className="h-1" style={{ background: gradients.accentBorder }} />

                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr>
                        <th className="p-5 w-44" style={{ background: bg.primary }} />
                        {block.products.map((prod) => (
                          <th
                            key={prod.asin}
                            className="p-5 text-center"
                            style={{
                              background: prod.isCurrentProduct ? primary[50] : bg.primary,
                              borderBottom: prod.isCurrentProduct
                                ? `2px solid ${primary[500]}`
                                : "none",
                            }}
                          >
                            <div
                              className="w-24 h-24 mx-auto mb-3 rounded-xl overflow-hidden"
                              style={{
                                border: prod.isCurrentProduct
                                  ? `2px solid ${primary[500]}`
                                  : "2px solid #f0ebe4",
                              }}
                            >
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color: prod.isCurrentProduct ? primary[500] : earth[700],
                                fontFamily: fonts.body,
                              }}
                            >
                              {prod.name}
                            </p>
                            {prod.isCurrentProduct && (
                              <span
                                className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
                                style={{ background: secondary[500] }}
                              >
                                <Check className="w-3 h-3" /> This Product
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {block.metrics.map((metric, idx) => (
                        <tr
                          key={metric.label}
                          style={{ background: idx % 2 === 0 ? bg.card : bg.primary }}
                        >
                          <td
                            className="px-5 py-4 text-sm font-medium"
                            style={{ color: earth[600], fontFamily: fonts.body }}
                          >
                            {metric.label}
                          </td>
                          {metric.values.map((val, vi) => (
                            <td key={vi} className="px-5 py-4 text-center">
                              {typeof val === "boolean" ? (
                                val ? (
                                  <span
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                                    style={{ background: primary[50] }}
                                  >
                                    <Check className="w-4 h-4" style={{ color: primary[500] }} />
                                  </span>
                                ) : (
                                  <span
                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full"
                                    style={{ background: "#f5f0ea" }}
                                  >
                                    <X className="w-3.5 h-3.5" style={{ color: earth[300] }} />
                                  </span>
                                )
                              ) : (
                                <span
                                  className="text-sm font-medium"
                                  style={{ color: earth[600], fontFamily: fonts.body }}
                                >
                                  {val}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )

          // ── IMAGE + TEXT STACKED ──────────────────────────────────────────────
          case "image_text":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                {block.title && <SectionTitle title={block.title} />}
                {/* Full-width image (970×600) → headline → description */}
                {block.imageUrl && (
                  <div
                    className="w-full rounded-xl overflow-hidden shadow-sm"
                    style={{ aspectRatio: "97/60" }}
                  >
                    <img
                      src={block.imageUrl}
                      alt={block.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {block.headline && (
                  <h4
                    className="text-lg sm:text-xl font-bold mt-5"
                    style={{ color: earth[700], fontFamily: fonts.heading }}
                  >
                    {block.headline}
                  </h4>
                )}
                {block.content && (
                  <p
                    className="text-sm sm:text-base leading-relaxed mt-3"
                    style={{
                      color: earth[600],
                      fontFamily: fonts.body,
                      lineHeight: 1.85,
                    }}
                  >
                    {block.content}
                  </p>
                )}
              </div>
            )

          // ── TEXT ONLY ─────────────────────────────────────────────────────────
          case "text":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                {block.title && (
                  <h3
                    className="text-xl sm:text-2xl font-bold mb-4"
                    style={{ color: earth[700], fontFamily: fonts.heading }}
                  >
                    {block.title}
                  </h3>
                )}
                {block.content && (
                  <p
                    className="text-sm sm:text-base"
                    style={{
                      color: earth[600],
                      fontFamily: fonts.body,
                      lineHeight: 1.8,
                      textAlign: "justify",
                    }}
                  >
                    {block.content}
                  </p>
                )}
              </div>
            )

          // ── STANDALONE IMAGE ─────────────────────────────────────────────────
          case "image":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                {block.title && (
                  <h3
                    className="text-xl sm:text-2xl font-bold mb-6"
                    style={{ color: earth[700], fontFamily: fonts.heading }}
                  >
                    {block.title}
                  </h3>
                )}
                {block.imageUrl && (
                  /* Full-width at exact 970:600 ratio — designed for this size */
                  <div
                    className="rounded-2xl overflow-hidden shadow-md"
                    style={{ aspectRatio: "97/60" }}
                  >
                    <img
                      src={block.imageUrl}
                      alt={block.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            )

          // ── BANNER ───────────────────────────────────────────────────────────
          case "banner":
            return (
              <div key={block.id}>
                {blockIdx > 0 && divider}
                {/* 970:600 ratio — fills perfectly with no crop or letterbox */}
                <div
                  className="relative rounded-2xl overflow-hidden shadow-xl"
                  style={block.imageUrl ? { aspectRatio: "97/60" } : {}}
                >
                  {block.imageUrl ? (
                    <>
                      <img
                        src={block.imageUrl}
                        alt={block.title}
                        className="w-full h-full object-cover"
                      />
                      {block.title && (
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(1,63,71,0.52)" }}
                        >
                          <h3
                            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center px-6"
                            style={{
                              fontFamily: fonts.heading,
                              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                            }}
                          >
                            {block.title}
                          </h3>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="h-32 flex items-center justify-center"
                      style={{
                        background: "linear-gradient(135deg, #013f47, #c85103)",
                      }}
                    >
                      <h3
                        className="text-2xl font-bold text-white text-center px-6"
                        style={{ fontFamily: fonts.heading }}
                      >
                        {block.title}
                      </h3>
                    </div>
                  )}
                </div>
              </div>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
