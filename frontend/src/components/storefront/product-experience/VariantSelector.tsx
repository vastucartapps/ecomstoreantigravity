"use client"

import type { VariantAttribute, SwatchValue } from "@/types/product-experience"
import { primary, earth, fonts } from "@/lib/theme"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

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
                    type="button"
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
            <ThemeSelect
              value={selectedValues[attr.name] || ""}
              onChange={(val) => onSelect(attr.name, val)}
              options={(attr.type === "swatch" && isSwatchValues(attr.values)
                ? attr.values.map((v) => v.value)
                : (attr.values as string[])
              ).map((v) => ({ value: v, label: v }))}
              placeholder="Select..."
            />
          )}
        </div>
      ))}
    </div>
  )
}

