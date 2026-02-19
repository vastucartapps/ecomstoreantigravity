"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Package,
  Heart,
  Star,
  Tag,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useWishlist } from "@/providers/wishlist-provider"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts, gradients } from "@/lib/theme"
import type { Order, LoyaltyBalance, Coupon } from "@/types/dashboard"

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  processing: { label: "Processing", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  confirmed: { label: "Confirmed", color: "#3B82F6", bg: "#EFF6FF", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "#8B5CF6", bg: "#F5F3FF", icon: Truck },
  delivered: { label: "Delivered", color: "#10B981", bg: "#ECFDF5", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2", icon: Package },
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  refunded: { label: "Refunded", color: "#6B7280", bg: "#F3F4F6", icon: Package },
}

export function DashboardHome() {
  const { user } = useAuth()
  const { wishlistCount } = useWishlist()
  const { fetchOrders, fetchLoyalty, fetchCoupons } = useDashboardData()

  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loyalty, setLoyalty] = useState<LoyaltyBalance>({ balance: 0, transactions: [] })
  const [couponsCount, setCouponsCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [orders, loyaltyData, coupons] = await Promise.allSettled([
          fetchOrders(3),
          fetchLoyalty(),
          fetchCoupons(),
        ])
        if (orders.status === "fulfilled") {
          setRecentOrders(orders.value)
          setTotalSpent(orders.value.reduce((s, o) => s + o.total, 0))
        }
        if (loyaltyData.status === "fulfilled") setLoyalty(loyaltyData.value)
        if (coupons.status === "fulfilled") setCouponsCount(coupons.value.length)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const firstName = user?.name?.split(" ")[0] || "there"
  const memberDate = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : ""

  const statCards = [
    {
      label: "Total Orders",
      value: recentOrders.length > 0 ? `${recentOrders.length}+` : "0",
      icon: Package,
      href: "/account/orders",
      color: primary[500],
      bg: `${primary[50]}`,
    },
    {
      label: "Wishlist Items",
      value: String(wishlistCount),
      icon: Heart,
      href: "/account/wishlist",
      color: "#EF4444",
      bg: "#FEF2F2",
    },
    {
      label: "Loyalty Points",
      value: loyalty.balance.toLocaleString("en-IN"),
      icon: Star,
      href: "/account/loyalty",
      color: "#F59E0B",
      bg: "#FFFBEB",
    },
    {
      label: "Active Coupons",
      value: String(couponsCount),
      icon: Tag,
      href: "/account/coupons",
      color: "#10B981",
      bg: "#ECFDF5",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{ background: `linear-gradient(135deg, ${primary[500]}18, ${primary[50]})`, border: `1px solid ${primary[100]}` }}
      >
        <div className="flex items-center gap-3">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xl"
              style={{ background: gradients.primaryButton }}
            >
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
              Welcome back, {firstName}!
            </h1>
            <p className="text-sm mt-0.5" style={{ color: earth[400], fontFamily: fonts.body }}>
              {memberDate && `Member since ${memberDate}`}
              {user?.phone && ` · ${user.phone}`}
            </p>
          </div>
        </div>

        {totalSpent > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${primary[100]}` }}>
            <p className="text-sm" style={{ color: earth[600] }}>
              Total lifetime spend:{" "}
              <span className="font-bold" style={{ color: primary[500] }}>
                ₹{totalSpent.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl p-4 transition-shadow hover:shadow-md group"
              style={{ background: card.bg, border: `1px solid ${card.bg}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5" style={{ color: card.color }} />
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: card.color, fontFamily: fonts.heading }}>
                {isLoading ? "—" : card.value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: earth[500], fontFamily: fonts.body }}>
                {card.label}
              </p>
            </Link>
          )
        })}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid #f0ebe4` }}>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #f0ebe4", background: bg.card }}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: primary[500] }} />
            <h2 className="text-sm font-semibold" style={{ color: earth[700], fontFamily: fonts.heading }}>
              Recent Orders
            </h2>
          </div>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
            style={{ color: primary[500] }}
          >
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-center">
            <div className="animate-spin w-6 h-6 rounded-full border-2 border-transparent mx-auto" style={{ borderTopColor: primary[500] }} />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="px-5 py-8 text-center" style={{ background: bg.card }}>
            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: earth[200] }} />
            <p className="text-sm" style={{ color: earth[400], fontFamily: fonts.body }}>
              No orders yet.{" "}
              <Link href="/" className="font-medium" style={{ color: primary[500] }}>
                Start shopping
              </Link>
            </p>
          </div>
        ) : (
          <div style={{ background: bg.card }}>
            {recentOrders.map((order) => {
              const status = STATUS_STYLES[order.status] || STATUS_STYLES.processing
              const StatusIcon = status.icon
              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:opacity-90 transition-opacity"
                  style={{ borderBottom: "1px solid #f0ebe4", textDecoration: "none" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: status.bg }}
                    >
                      <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: earth[700] }}>
                        {order.orderNumber}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: earth[400] }}>
                        {order.orderDate} · {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: primary[500] }}>
                        ₹{order.total.toLocaleString("en-IN")}
                      </p>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: earth[300] }} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "My Bookings", href: "/account/bookings", icon: "🗓️" },
          { label: "Gift Cards", href: "/account/gift-cards", icon: "🎁" },
          { label: "Account Security", href: "/account/security", icon: "🛡️" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 p-4 rounded-xl hover:shadow-sm transition-shadow"
            style={{ background: bg.card, border: "1px solid #f0ebe4" }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-medium" style={{ color: earth[600], fontFamily: fonts.body }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
