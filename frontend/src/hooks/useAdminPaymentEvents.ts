"use client"

import { useCallback } from "react"
import { adminFetch } from "@/lib/medusa"
import type {
  PaymentEventsResponse,
  PaymentStage,
  WindowChoice,
} from "@/types/admin-payment-events"

export function useAdminPaymentEvents() {
  const fetchEvents = useCallback(
    async (
      window: WindowChoice = "7d",
      stage?: PaymentStage | "all",
      provider?: string,
      limit = 100
    ): Promise<PaymentEventsResponse> => {
      const params = new URLSearchParams()
      params.set("window", window)
      if (stage && stage !== "all") params.set("stage", stage)
      if (provider && provider !== "all") params.set("provider", provider)
      params.set("limit", String(limit))

      const res = await adminFetch<PaymentEventsResponse>(
        `/admin/payment-events?${params.toString()}`
      )
      return res
    },
    []
  )

  return { fetchEvents }
}
