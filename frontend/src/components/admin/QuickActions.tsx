"use client"

import { PlusCircle, ShoppingCart, Ticket } from "lucide-react"
import type { QuickAction, IconName } from "@/types/admin-dashboard"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  earth700: "#433b35",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
}

const iconMap: Partial<Record<IconName, React.ElementType>> = {
  "plus-circle": PlusCircle,
  "shopping-cart": ShoppingCart,
  ticket: Ticket,
}

interface QuickActionsProps {
  quickActions: QuickAction[]
  onQuickAction?: (href: string) => void
}

export function QuickActions({ quickActions, onQuickAction }: QuickActionsProps) {
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
        className="mb-4 text-xl font-bold"
        style={{ fontFamily: fonts.heading, color: c.earth700 }}
      >
        Quick Actions
      </h2>

      <div className="space-y-3">
        {quickActions.map((action) => {
          const isPrimary = action.color === "primary"
          const bgColor = isPrimary ? c.primary500 : c.secondary500
          const bgHover = isPrimary ? c.primary400 : c.secondary300
          const IconComponent = iconMap[action.icon] || PlusCircle

          return (
            <button
              key={action.id}
              onClick={() => onQuickAction?.(action.href)}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-medium transition-all duration-200"
              style={{
                backgroundColor: bgColor,
                color: "#ffffff",
                fontFamily: fonts.body,
                boxShadow: c.shadow,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = bgHover
                e.currentTarget.style.boxShadow = c.shadowHover
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = bgColor
                e.currentTarget.style.boxShadow = c.shadow
              }}
            >
              <IconComponent size={18} strokeWidth={2} />
              <span className="text-sm">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
