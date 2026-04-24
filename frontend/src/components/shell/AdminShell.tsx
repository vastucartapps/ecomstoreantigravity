"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  RotateCcw,
  Users,
  Star,
  Ticket,
  Calendar,
  Truck,
  CreditCard,
  FileText,
  Link2,
  Bell,
  Award,
  Megaphone,
  Headphones,
  Activity,
  MailX,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { primary, earth, gradients, fonts, bg } from "./theme"
import AdminHeader from "./AdminHeader"

interface AdminShellProps {
  children: React.ReactNode
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
}

const navItems: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
  { id: "products", label: "Products", icon: Package, href: "/admin/products" },
  { id: "categories", label: "Categories", icon: FolderTree, href: "/admin/categories" },
  { id: "orders", label: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  { id: "returns", label: "Returns & Refunds", icon: RotateCcw, href: "/admin/returns" },
  { id: "customers", label: "Customers", icon: Users, href: "/admin/customers" },
  { id: "reviews", label: "Reviews & Q&A", icon: Star, href: "/admin/reviews" },
  { id: "coupons", label: "Coupons & Gift Cards", icon: Ticket, href: "/admin/coupons" },
  { id: "bookings", label: "Bookings", icon: Calendar, href: "/admin/bookings" },
  { id: "shipping", label: "Shipping & Delivery", icon: Truck, href: "/admin/shipping" },
  { id: "payments", label: "Payments & Tax", icon: CreditCard, href: "/admin/payments" },
  { id: "payment-events", label: "Payment Funnel", icon: Activity, href: "/admin/payment-events" },
  { id: "abandoned-carts", label: "Abandoned Carts", icon: MailX, href: "/admin/abandoned-carts" },
  { id: "content", label: "Content & Storefront", icon: FileText, href: "/admin/storefront" },
  { id: "integrations", label: "Integrations & SEO", icon: Link2, href: "/admin/integrations" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/admin/notifications" },
  { id: "loyalty", label: "Loyalty & Rewards", icon: Award, href: "/admin/loyalty" },
  { id: "ecosystem-ads", label: "Ecosystem Ads", icon: Megaphone, href: "/admin/ecosystem-ads" },
  { id: "support", label: "Support Tickets", icon: Headphones, href: "/admin/support" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
]

const c = {
  primary500: primary[500],
  primary50: "#e8f5f3",
  earth300: earth[300],
  earth400: earth[400],
  earth600: "#5a4f47",
  card: "#ffffff",
  bg: "#fffbf5",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
}

export default function AdminShell({ children }: AdminShellProps) {
  const { user, isLoading, isAdmin, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  // Desktop: start expanded; mobile: start collapsed (icon strip)
  const [collapsed, setCollapsed] = useState(false)

  // Auto-collapse on mobile after mount
  useEffect(() => {
    if (window.innerWidth < 1024) setCollapsed(true)
  }, [])

  // Close expanded overlay when navigating on mobile
  useEffect(() => {
    if (window.innerWidth < 1024 && !collapsed) setCollapsed(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  // Loading
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg.primary,
          fontFamily: fonts.body,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "2.5rem",
              height: "2.5rem",
              borderRadius: "9999px",
              border: `3px solid ${primary[100]}`,
              borderTopColor: primary[500],
              animation: "spin 0.75s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: "0.875rem", color: earth[400], fontFamily: fonts.body }}>
            Loading admin panel...
          </span>
        </div>
      </div>
    )
  }

  // Access denied
  if (!isLoading && (!user || !isAdmin)) {
    router.replace("/login")
  }

  if (!user || !isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg.primary,
          fontFamily: fonts.body,
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "28rem" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "9999px",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <span style={{ fontSize: "1.75rem" }}>🔒</span>
          </div>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "1.5rem",
              fontWeight: 700,
              color: primary[500],
              marginBottom: "0.5rem",
            }}
          >
            Access Denied
          </h1>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: "0.9375rem",
              color: earth[400],
              marginBottom: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            You do not have permission to access the admin panel.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              background: gradients.primaryButton,
              color: "#ffffff",
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            <ExternalLink size={15} />
            Back to Storefront
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: c.bg }}>
      {/* Sticky header */}
      <AdminHeader />

      {/* Body */}
      <div className="flex flex-1">
        {/* ── Backdrop (mobile only, when sidebar is expanded) ──────────────── */}
        {!collapsed && (
          <div
            className="lg:hidden fixed inset-0 z-30"
            style={{ top: "3.5rem", backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={() => setCollapsed(true)}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        {/*
            Mobile:  position fixed below header (top-14), always visible as 72px icon
                     strip; expands to 260px overlay when toggled.
            Desktop: static flex item, same collapse/expand inline.
        */}
        <aside
          className={[
            "flex flex-col flex-shrink-0 border-r",
            "transition-[width] duration-300 ease-in-out",
            // Mobile: fixed below header, above backdrop
            "fixed top-14 bottom-0 left-0 z-40",
            // Desktop: back to normal flow
            "lg:static lg:top-auto lg:bottom-auto lg:left-auto lg:z-auto",
          ].join(" ")}
          style={{
            width: collapsed ? 72 : 260,
            backgroundColor: c.card,
            borderColor: "#f0ebe4",
            boxShadow: !collapsed ? "4px 0 24px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {/* Gradient accent strip */}
          <div className="h-1 flex-shrink-0" style={{ background: c.gradient }} />

          {/* Sidebar header */}
          <div
            className="flex items-center justify-between px-3 py-3 border-b flex-shrink-0"
            style={{ borderColor: "#f0ebe4" }}
          >
            {!collapsed && (
              <Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
                style={{ textDecoration: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.bg }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <ExternalLink size={13} color={c.primary500} />
                <span className="text-xs font-medium" style={{ fontFamily: fonts.body, color: c.primary500 }}>
                  View Storefront
                </span>
              </Link>
            )}
            {collapsed && (
              <Link href="/" target="_blank" rel="noopener noreferrer" className="p-1.5">
                <ExternalLink size={16} color={c.earth400} />
              </Link>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md transition-colors flex-shrink-0"
              style={{ color: c.earth400 }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.bg }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 px-2 overflow-y-auto">
            <ul className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="w-full flex items-center gap-3 rounded-lg transition-all duration-150"
                      style={{
                        padding: collapsed ? "10px" : "9px 12px",
                        justifyContent: collapsed ? "center" : "flex-start",
                        backgroundColor: isActive ? c.primary50 : "transparent",
                        color: isActive ? c.primary500 : c.earth600,
                        fontFamily: fonts.body,
                        textDecoration: "none",
                        borderLeft: collapsed
                          ? "none"
                          : isActive
                            ? `3px solid ${c.primary500}`
                            : "3px solid transparent",
                      }}
                      title={collapsed ? item.label : undefined}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = c.bg
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                      {!collapsed && (
                        <span className="flex-1 text-left text-sm font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout */}
          <div className="px-2 py-3 border-t flex-shrink-0" style={{ borderColor: "#f0ebe4" }}>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg transition-colors"
              style={{
                padding: collapsed ? "10px" : "9px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                color: c.earth400,
                fontFamily: fonts.body,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              title={collapsed ? "Logout" : undefined}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = c.bg }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
            >
              <LogOut size={19} />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        {/*
            Mobile: always leave 72px on the left for the fixed icon strip.
            Desktop: sidebar is in the flow so no margin needed.
        */}
        <div className="flex-1 min-w-0 overflow-x-hidden ml-[72px] lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
