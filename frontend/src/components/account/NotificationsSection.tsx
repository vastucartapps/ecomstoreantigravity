"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Package, Tag, Star, AlertCircle, CheckCheck, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { CustomerNotification } from "@/types/dashboard"

const TYPE_CONFIG = {
  order: { icon: Package, color: primary[500], bg: `${primary[50]}`, label: "Order" },
  promotion: { icon: Tag, color: "#10B981", bg: "#ECFDF5", label: "Promotion" },
  stock: { icon: AlertCircle, color: "#F59E0B", bg: "#FFFBEB", label: "Stock" },
  loyalty: { icon: Star, color: "#F59E0B", bg: "#FFFBEB", label: "Loyalty" },
}

const FILTER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Orders", value: "order" },
  { label: "Promotions", value: "promotion" },
  { label: "Stock", value: "stock" },
  { label: "Loyalty", value: "loyalty" },
]

export function NotificationsSection() {
  const { fetchNotifications, markNotificationRead } = useDashboardData()
  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("")
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async (filterType = "") => {
    try {
      const result = await fetchNotifications({ type: filterType || undefined, limit: 50 })
      setNotifications(result.notifications)
      setUnreadCount(result.unread_count)
    } finally {
      setIsLoading(false)
    }
  }, [fetchNotifications])

  useEffect(() => {
    load(filter)
    // Poll every 60s
    const interval = setInterval(() => load(filter), 60000)
    return () => clearInterval(interval)
  }, [filter])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markNotificationRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } finally {
      setMarkingAll(false)
    }
  }

  const formatDate = (d: string) => {
    const now = new Date()
    const date = new Date(d)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "#EF4444" }}>
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
            Stay updated with your orders and offers
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: primary[500] }}
          >
            {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setFilter(opt.value); setIsLoading(true) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === opt.value ? primary[500] : bg.card,
              color: filter === opt.value ? "#ffffff" : earth[600],
              border: `1px solid ${filter === opt.value ? primary[500] : "#e8e0d8"}`,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        {isLoading ? (
          <div className="py-12 text-center" style={{ background: bg.card }}>
            <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center" style={{ background: bg.card }}>
            <Bell className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
            <p className="text-sm font-medium" style={{ color: earth[500] }}>No notifications yet</p>
            <p className="text-xs mt-1" style={{ color: earth[300] }}>
              Order updates and offers will appear here
            </p>
          </div>
        ) : (
          <div style={{ background: bg.card }}>
            {notifications.map((notif, idx) => {
              const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.order
              const Icon = config.icon
              const isLast = idx === notifications.length - 1
              return (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors"
                  style={{
                    borderBottom: isLast ? "none" : "1px solid #f0ebe4",
                    background: notif.is_read ? "transparent" : `${primary[50]}80`,
                  }}
                  onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                  onMouseEnter={(e) => { if (notif.is_read) e.currentTarget.style.background = "#faf7f4" }}
                  onMouseLeave={(e) => { if (notif.is_read) e.currentTarget.style.background = "transparent" }}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bg }}>
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold" style={{ color: notif.is_read ? earth[600] : earth[700] }}>
                        {notif.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs" style={{ color: earth[300] }}>{formatDate(notif.created_at)}</span>
                        {!notif.is_read && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: primary[500] }} />
                        )}
                      </div>
                    </div>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: earth[400] }}>{notif.message}</p>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="flex items-center gap-1 text-xs mt-1.5 font-medium hover:opacity-70"
                        style={{ color: primary[500] }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View details <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
