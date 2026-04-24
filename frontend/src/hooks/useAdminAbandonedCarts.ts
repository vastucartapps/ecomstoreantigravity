"use client"

import { useCallback } from "react"
import { adminFetch } from "@/lib/medusa"
import type {
  AbandonedCartsResponse,
  RecoveredFilter,
  StageFilter,
  WindowChoice,
} from "@/types/admin-abandoned-carts"

export function useAdminAbandonedCarts() {
  const fetchAttempts = useCallback(
    async (
      window: WindowChoice = "7d",
      stage: StageFilter = "all",
      recovered: RecoveredFilter = "all",
      limit = 200
    ): Promise<AbandonedCartsResponse> => {
      const params = new URLSearchParams()
      params.set("window", window)
      if (stage !== "all") params.set("stage", stage)
      if (recovered !== "all") params.set("recovered", recovered)
      params.set("limit", String(limit))

      return adminFetch<AbandonedCartsResponse>(`/admin/abandoned-carts?${params.toString()}`)
    },
    []
  )

  return { fetchAttempts }
}
