"use client"

import { useState, useEffect, useCallback } from "react"
import AbandonedCartsDashboard from "@/components/admin/AbandonedCartsDashboard"
import { useAdminAbandonedCarts } from "@/hooks/useAdminAbandonedCarts"
import type {
  AbandonedCartAttempt,
  AbandonedCartStats,
  RecoveredFilter,
  StageFilter,
  WindowChoice,
} from "@/types/admin-abandoned-carts"

export default function AbandonedCartsPage() {
  const { fetchAttempts } = useAdminAbandonedCarts()
  const [window, setWindow] = useState<WindowChoice>("7d")
  const [stage, setStage] = useState<StageFilter>("all")
  const [recovered, setRecovered] = useState<RecoveredFilter>("all")
  const [stats, setStats] = useState<AbandonedCartStats | null>(null)
  const [attempts, setAttempts] = useState<AbandonedCartAttempt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchAttempts(window, stage, recovered, 200)
      setStats(res.stats)
      setAttempts(res.attempts || [])
    } catch {
      setStats(null)
      setAttempts([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchAttempts, window, stage, recovered])

  useEffect(() => { load() }, [load])

  return (
    <AbandonedCartsDashboard
      isLoading={isLoading}
      window={window}
      onChangeWindow={setWindow}
      stage={stage}
      onChangeStage={setStage}
      recovered={recovered}
      onChangeRecovered={setRecovered}
      stats={stats}
      attempts={attempts}
    />
  )
}
