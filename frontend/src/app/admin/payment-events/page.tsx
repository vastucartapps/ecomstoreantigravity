"use client"

import { useState, useEffect, useCallback } from "react"
import PaymentEventsDashboard from "@/components/admin/PaymentEventsDashboard"
import { useAdminPaymentEvents } from "@/hooks/useAdminPaymentEvents"
import type {
  PaymentEventRow,
  PaymentFunnelStats,
  PaymentStage,
  WindowChoice,
} from "@/types/admin-payment-events"

export default function PaymentEventsPage() {
  const { fetchEvents } = useAdminPaymentEvents()

  const [window, setWindow] = useState<WindowChoice>("7d")
  const [stage, setStage] = useState<PaymentStage | "all">("all")
  const [provider, setProvider] = useState<string>("all")
  const [stats, setStats] = useState<PaymentFunnelStats | null>(null)
  const [events, setEvents] = useState<PaymentEventRow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetchEvents(window, stage, provider, 200)
      setStats(res.stats)
      setEvents(res.events || [])
    } catch {
      setStats(null)
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchEvents, window, stage, provider])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PaymentEventsDashboard
      isLoading={isLoading}
      window={window}
      onChangeWindow={setWindow}
      stage={stage}
      onChangeStage={setStage}
      provider={provider}
      onChangeProvider={setProvider}
      stats={stats}
      events={events}
    />
  )
}
