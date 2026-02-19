"use client"

import { useState } from "react"
import type { RevenueBar } from "@/types/admin-dashboard"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  secondary500: "#c85103",
  earth500: "#71685b",
  earth700: "#433b35",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

interface RevenueChartProps {
  revenueBars: RevenueBar[]
  isLoading?: boolean
}

function SkeletonChart() {
  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: c.shadow,
        borderTop: "3px solid transparent",
        borderImage: c.gradient,
        borderImageSlice: 1,
      }}
    >
      <div className="h-6 w-40 rounded bg-gray-100 mb-6 animate-pulse" />
      <div className="flex items-end justify-between gap-2" style={{ height: 240 }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-t animate-pulse"
            style={{
              height: `${40 + Math.random() * 60}%`,
              backgroundColor: "#f3f4f6",
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function RevenueChart({ revenueBars, isLoading }: RevenueChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (isLoading) return <SkeletonChart />

  const maxAmount = revenueBars.length > 0 ? Math.max(...revenueBars.map((b) => b.amount), 1) : 1
  const maxHeight = 200

  return (
    <div
      className="rounded-lg p-6"
      style={{
        backgroundColor: "#ffffff",
        boxShadow: c.shadow,
        borderTop: "3px solid transparent",
        borderImage: c.gradient,
        borderImageSlice: 1,
      }}
    >
      <h2
        className="mb-6 text-xl font-bold"
        style={{ fontFamily: fonts.heading, color: c.earth700 }}
      >
        Revenue Overview
      </h2>

      {revenueBars.length === 0 ? (
        <div
          className="py-12 text-center"
          style={{ color: c.earth500, fontFamily: fonts.body }}
        >
          No revenue data for this period
        </div>
      ) : (
        <div className="relative">
          <div
            className="flex items-end justify-between gap-1 sm:gap-3"
            style={{ height: maxHeight + 60 }}
          >
            {revenueBars.map((bar, index) => {
              const barHeight = Math.max((bar.amount / maxAmount) * maxHeight, 4)
              const isHovered = hoveredIndex === index

              return (
                <div
                  key={bar.date}
                  className="relative flex flex-1 flex-col items-center"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div
                      className="absolute bottom-full mb-2 whitespace-nowrap rounded px-2 py-1 text-xs font-semibold z-10"
                      style={{
                        backgroundColor: c.earth700,
                        color: "#ffffff",
                        fontFamily: fonts.mono,
                      }}
                    >
                      ₹{bar.amount.toLocaleString("en-IN")}
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    className="w-full cursor-pointer rounded-t transition-all duration-300"
                    style={{
                      height: barHeight,
                      background: isHovered
                        ? `linear-gradient(to top, ${c.primary500}, ${c.secondary500})`
                        : `linear-gradient(to top, ${c.primary500}, ${c.primary400})`,
                      opacity: hoveredIndex === null || isHovered ? 1 : 0.6,
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />

                  {/* Label */}
                  <div
                    className="mt-3 text-center text-xs font-medium"
                    style={{
                      fontFamily: fonts.body,
                      color: isHovered ? c.earth700 : c.earth500,
                    }}
                  >
                    {bar.label}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Baseline */}
          <div
            className="absolute left-0 right-0"
            style={{
              height: 1,
              backgroundColor: c.earth500,
              opacity: 0.2,
              bottom: 40,
            }}
          />
        </div>
      )}
    </div>
  )
}
