"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { VariantAttribute, SwatchValue } from "@/types/product-experience"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"

interface VariantSelectorProps {
  attributes: VariantAttribute[]
  selectedValues: Record<string, string>
  onSelect: (attrName: string, value: string) => void
}

function isSwatchValues(values: string[] | SwatchValue[]): values is SwatchValue[] {
  return values.length > 0 && typeof values[0] === "object"
}

export function VariantSelector({ attributes, selectedValues, onSelect }: VariantSelectorProps) {
  return (
    <div className="space-y-5">
      {attributes.map((attr) => (
        <div key={attr.name}>
          <p
            className="text-sm font-semibold mb-2.5"
            style={{ color: earth[700], fontFamily: fonts.body }}
          >
            {attr.label}:{" "}
            <span style={{ color: primary[500], fontWeight: 600 }}>
              {selectedValues[attr.name] || ""}
            </span>
          </p>

          {attr.type === "swatch" && isSwatchValues(attr.values) ? (
            <div className="flex flex-wrap gap-2.5">
              {attr.values.map((sv) => {
                const selected = selectedValues[attr.name] === sv.value
                return (
                  <button
                    key={sv.value}
                    onClick={() => onSelect(attr.name, sv.value)}
                    className="relative w-10 h-10 rounded-xl transition-all duration-200"
                    style={{
                      background: sv.color,
                      border: selected ? `2px solid ${primary[500]}` : "2px solid #e8e0d8",
                      boxShadow: selected ? `0 0 0 2px ${primary[50]}` : "none",
                    }}
                    title={sv.value}
                  >
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-sm" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 8.5L6.5 12L13 4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <DropdownSelect
              options={attr.type === "swatch" && isSwatchValues(attr.values) ? attr.values.map((v) => v.value) : (attr.values as string[])}
              selected={selectedValues[attr.name] || ""}
              onSelect={(val) => onSelect(attr.name, val)}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function DropdownSelect({
  options,
  selected,
  onSelect,
}: {
  options: string[]
  selected: string
  onSelect: (val: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
        style={{
          border: `1.5px solid ${open ? primary[400] : "#e8e0d8"}`,
          color: earth[700],
          background: bg.card,
          fontFamily: fonts.body,
          boxShadow: open ? `0 0 0 3px ${primary[500]}10` : "none",
        }}
      >
        <span>{selected || "Select..."}</span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: earth[300],
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl overflow-hidden py-1"
          style={{
            background: bg.card,
            border: "1px solid #f0ebe4",
            boxShadow: "0 8px 24px rgba(67,59,53,0.12)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onSelect(opt); setOpen(false) }}
              className="w-full px-4 py-2.5 text-sm text-left transition-colors"
              style={{
                background: opt === selected ? primary[50] : "transparent",
                color: opt === selected ? primary[500] : earth[600],
                fontWeight: opt === selected ? 600 : 400,
                fontFamily: fonts.body,
              }}
              onMouseEnter={(e) => { if (opt !== selected) e.currentTarget.style.background = bg.primary }}
              onMouseLeave={(e) => { if (opt !== selected) e.currentTarget.style.background = "transparent" }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
