"use client"

import { Check, X } from "lucide-react"
import type { RichContentBlock } from "@/types/product-experience"
import { primary, secondary, earth, bg, fonts, gradients } from "@/lib/theme"

interface RichContentProps {
  blocks: RichContentBlock[]
}

export function RichContent({ blocks }: RichContentProps) {
  return (
    <div className="space-y-16">
      {blocks.map((block) => {
        if (block.type === "hero") {
          return (
            <div key={block.id}>
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
                <h3
                  className="text-xl sm:text-2xl font-bold text-center px-4"
                  style={{ color: earth[700], fontFamily: fonts.heading }}
                >
                  {block.title}
                </h3>
                <div className="flex-1 h-px" style={{ background: gradients.accentBorder }} />
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-lg">
                <img
                  src={block.imageUrl}
                  alt={block.title}
                  className="w-full h-72 sm:h-80 lg:h-[420px] object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, transparent 30%, rgba(1,63,71,0.82) 100%)" }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
                  <h4
                    className="text-xl sm:text-2xl font-bold text-white"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {block.headline}
                  </h4>
                </div>
              </div>

              <p
                className="mt-6 text-sm sm:text-base leading-relaxed"
                style={{ color: earth[600], fontFamily: fonts.body, lineHeight: 1.8 }}
              >
                {block.description}
              </p>
            </div>
          )
        }

        if (block.type === "comparison") {
          return (
            <div key={block.id}>
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
                            borderBottom: prod.isCurrentProduct ? `2px solid ${primary[500]}` : "none",
                          }}
                        >
                          <div
                            className="w-24 h-24 mx-auto mb-3 rounded-xl overflow-hidden"
                            style={{
                              border: prod.isCurrentProduct ? `2px solid ${primary[500]}` : "2px solid #f0ebe4",
                            }}
                          >
                            <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
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
        }

        // Wizard A+ block types: image_text, text, image
        const b = block as any
        if (b.type === "image_text") {
          return (
            <div key={b.id} className="flex flex-col md:flex-row gap-8 items-center">
              {b.imageUrl && (
                <div className="w-full md:w-1/2 rounded-2xl overflow-hidden shadow-md">
                  <img src={b.imageUrl} alt={b.title || ""} className="w-full h-64 md:h-80 object-cover" />
                </div>
              )}
              <div className="w-full md:w-1/2">
                {b.title && (
                  <h3
                    className="text-xl sm:text-2xl font-bold mb-4"
                    style={{ color: earth[700], fontFamily: fonts.heading }}
                  >
                    {b.title}
                  </h3>
                )}
                {b.content && (
                  <p
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: earth[600], fontFamily: fonts.body, lineHeight: 1.8 }}
                  >
                    {b.content}
                  </p>
                )}
              </div>
            </div>
          )
        }

        if (b.type === "text") {
          return (
            <div key={b.id} className="max-w-3xl mx-auto text-center">
              {b.title && (
                <h3
                  className="text-xl sm:text-2xl font-bold mb-4"
                  style={{ color: earth[700], fontFamily: fonts.heading }}
                >
                  {b.title}
                </h3>
              )}
              {b.content && (
                <p
                  className="text-sm sm:text-base leading-relaxed"
                  style={{ color: earth[600], fontFamily: fonts.body, lineHeight: 1.8 }}
                >
                  {b.content}
                </p>
              )}
            </div>
          )
        }

        if (b.type === "image") {
          return (
            <div key={b.id} className="text-center">
              {b.title && (
                <h3
                  className="text-xl sm:text-2xl font-bold mb-6"
                  style={{ color: earth[700], fontFamily: fonts.heading }}
                >
                  {b.title}
                </h3>
              )}
              {b.imageUrl && (
                <div className="rounded-2xl overflow-hidden shadow-lg inline-block max-w-2xl w-full">
                  <img src={b.imageUrl} alt={b.title || ""} className="w-full object-cover" />
                </div>
              )}
            </div>
          )
        }

        if (b.type === "banner") {
          return (
            <div key={b.id} className="relative rounded-2xl overflow-hidden shadow-xl">
              {b.imageUrl && (
                <img
                  src={b.imageUrl}
                  alt={b.title || ""}
                  className="w-full h-48 sm:h-64 lg:h-80 object-cover"
                />
              )}
              {b.title && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(1,63,71,0.55)" }}
                >
                  <h3
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center px-6"
                    style={{ fontFamily: fonts.heading, textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
                  >
                    {b.title}
                  </h3>
                </div>
              )}
              {!b.imageUrl && b.title && (
                <div
                  className="h-32 flex items-center justify-center rounded-2xl"
                  style={{ background: "linear-gradient(135deg, #013f47, #c85103)" }}
                >
                  <h3
                    className="text-2xl font-bold text-white text-center px-6"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {b.title}
                  </h3>
                </div>
              )}
            </div>
          )
        }

        return null
      })}
    </div>
  )
}
