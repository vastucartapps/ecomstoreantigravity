"use client"

import { Check } from "lucide-react"
import { primary, earth, fonts } from "@/lib/theme"

interface Step {
  id: string
  label: string
  status: "completed" | "active" | "upcoming"
}

interface StepIndicatorProps {
  steps: Step[]
  onGoToStep?: (stepId: string) => void
}

export function StepIndicator({ steps, onGoToStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          {/* Step */}
          <button
            onClick={() => step.status === "completed" && onGoToStep?.(step.id)}
            disabled={step.status !== "completed"}
            className="flex flex-col items-center gap-1.5 group"
          >
            {/* Circle */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background:
                  step.status === "completed"
                    ? primary[500]
                    : step.status === "active"
                    ? `linear-gradient(135deg, ${primary[500]}, #054348)`
                    : "#f0ebe4",
                color:
                  step.status === "upcoming" ? earth[300] : "#fff",
                boxShadow:
                  step.status === "active"
                    ? `0 0 0 3px ${primary[50]}, 0 0 0 5px ${primary[500]}`
                    : "none",
              }}
            >
              {step.status === "completed" ? (
                <Check className="w-4 h-4" />
              ) : (
                <span style={{ fontFamily: fonts.body }}>{idx + 1}</span>
              )}
            </div>

            {/* Label */}
            <span
              className="text-[11px] font-medium whitespace-nowrap hidden sm:block"
              style={{
                color:
                  step.status === "active"
                    ? primary[500]
                    : step.status === "completed"
                    ? earth[600]
                    : earth[300],
                fontFamily: fonts.body,
              }}
            >
              {step.label}
            </span>
          </button>

          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div
              className="w-12 sm:w-16 h-0.5 mx-1 transition-all"
              style={{
                background:
                  steps[idx + 1].status !== "upcoming" ? primary[500] : "#f0ebe4",
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
