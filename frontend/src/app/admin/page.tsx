"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminOverviewDashboard } from "@/components/admin"
import { useAdminDashboard } from "@/hooks/useAdminDashboard"
import { medusa } from "@/lib/medusa"
import type { TimePeriod, OrderStatus } from "@/types/admin-dashboard"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("today")
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const { stats, revenueBars, recentOrders, quickActions, alerts, marketingHealth, isLoading, refetch } =
    useAdminDashboard(timePeriod)

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period)
    // refetch happens automatically via useEffect in the hook when timePeriod changes
  }

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await medusa.client.fetch(`/admin/orders/${orderId}`, {
        method: "POST",
        body: { metadata: { display_status: status } },
      })
      refetch()
    } catch (err: any) {
      // Surface the real reason — admins changing status from the dashboard
      // had no feedback when the call failed (auth, validation, network),
      // so the row kept its old status and they assumed it worked.
      console.error("Order status update failed:", err)
      window.alert(`Failed to update order status: ${err?.message || "please try again"}`)
    }
  }

  const handleStatClick = (linkTo: string) => {
    router.push(`/admin/${linkTo}`)
  }

  const handleViewOrder = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`)
  }

  const handleQuickAction = (href: string) => {
    router.push(href)
  }

  const handleAlertClick = (linkTo: string) => {
    router.push(linkTo)
  }

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]))
  }

  const visibleAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id))

  return (
    <AdminOverviewDashboard
      stats={stats}
      revenueBars={revenueBars}
      recentOrders={recentOrders}
      quickActions={quickActions}
      alerts={visibleAlerts}
      timePeriod={timePeriod}
      isLoading={isLoading}
      marketingHealth={marketingHealth}
      onTimePeriodChange={handleTimePeriodChange}
      onStatClick={handleStatClick}
      onViewOrder={handleViewOrder}
      onUpdateOrderStatus={handleUpdateOrderStatus}
      onQuickAction={handleQuickAction}
      onAlertClick={handleAlertClick}
      onDismissAlert={handleDismissAlert}
    />
  )
}
