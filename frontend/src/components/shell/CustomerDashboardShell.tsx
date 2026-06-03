"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Tag,
  Star,
  Calendar,
  Gift,
  Bell,
  MessageCircle,
  Shield,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useLoyaltyEnabled } from "@/providers/announcement-provider"
import { primary, secondary, earth, bg, gradients, fonts, shadows } from "./theme"

interface CustomerDashboardShellProps {
  children: React.ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: "Dashboard Home", href: "/account", icon: LayoutDashboard },
  { label: "My Orders", href: "/account/orders", icon: Package },
  { label: "Address Book", href: "/account/addresses", icon: MapPin },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Coupons", href: "/account/coupons", icon: Tag },
  { label: "Loyalty Points", href: "/account/loyalty", icon: Star },
  { label: "My Bookings", href: "/account/bookings", icon: Calendar },
  { label: "Gift Cards", href: "/account/gift-cards", icon: Gift },
  { label: "Notifications", href: "/account/notifications", icon: Bell },
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "Security", href: "/account/security", icon: Shield },
  { label: "Support", href: "/account/support", icon: MessageCircle },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isActiveItem(href: string, pathname: string): boolean {
  if (href === "/account") {
    return pathname === "/account"
  }
  return pathname.startsWith(href)
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

function customerHeaders(): Record<string, string> {
  const h: Record<string, string> = { "x-publishable-api-key": PUB_KEY }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("medusa_auth_token")
    if (token) h["Authorization"] = `Bearer ${token}`
  }
  return h
}

interface SidebarContentProps {
  user: { name: string; email: string; avatarUrl?: string | null }
  pathname: string
  handleLogout: () => void
  unreadCount: number
}

// MUST be module-level — not inside CustomerDashboardShell — otherwise React creates a new
// component type on every render, causing unnecessary unmount/remount on every state update.
function SidebarContent({ user, pathname, handleLogout, unreadCount }: SidebarContentProps) {
  const loyaltyEnabled = useLoyaltyEnabled()
  // Hide the Loyalty Points nav item when the program is disabled system-wide.
  const visibleNavItems = navItems.filter(
    (item) => loyaltyEnabled || item.href !== "/account/loyalty"
  )
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: fonts.body,
      }}
    >
      {/* User Info */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: `1px solid ${primary[100]}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
                boxShadow: shadows.glowPrimary,
              }}
            />
          ) : (
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: gradients.primaryButton,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: 700,
                fontFamily: fonts.body,
                letterSpacing: "0.5px",
                boxShadow: shadows.glowPrimary,
              }}
            >
              {getInitials(user.name)}
            </div>
          )}
          {/* Name + Email */}
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: primary[900],
                fontFamily: fonts.body,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.name}
            </p>
            <p
              style={{
                margin: "2px 0 0 0",
                fontSize: "12px",
                color: earth[400],
                fontFamily: fonts.body,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "12px 0",
          overflowY: "auto",
        }}
      >
        {visibleNavItems.map((item) => {
          const active = isActiveItem(item.href, pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 20px",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: active ? 600 : 400,
                color: active ? primary[500] : earth[600],
                backgroundColor: active ? `${primary[50]}cc` : "transparent",
                borderLeft: active ? `3px solid ${primary[500]}` : "3px solid transparent",
                transition: "background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease",
                fontFamily: fonts.body,
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.backgroundColor = `${primary[50]}88`
                  el.style.color = primary[500]
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  const el = e.currentTarget as HTMLElement
                  el.style.backgroundColor = "transparent"
                  el.style.color = earth[600]
                }
              }}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.8}
                style={{ flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.href === "/account/notifications" && unreadCount > 0 && (
                <span
                  style={{
                    background: "#EF4444",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "10px",
                    padding: "1px 6px",
                    flexShrink: 0,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider + Logout */}
      <div
        style={{
          borderTop: `1px solid ${primary[100]}`,
          padding: "12px 20px 20px",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            padding: "10px 0",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "13.5px",
            fontWeight: 500,
            color: secondary[500],
            fontFamily: fonts.body,
            textAlign: "left",
            transition: "color 0.15s ease",
            borderRadius: "4px",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = secondary[600]
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.color = secondary[500]
          }}
        >
          <LogOut size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default function CustomerDashboardShell({ children }: CustomerDashboardShellProps) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Fetch unread notification count
  useEffect(() => {
    if (!user) return
    const fetchCount = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/store/customers/me/notifications?limit=1`, {
          headers: customerHeaders(),
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unread_count || 0)
        }
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          fontFamily: fonts.body,
          backgroundColor: bg.primary,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: `3px solid ${primary[100]}`,
              borderTopColor: primary[500],
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p
            style={{
              color: earth[400],
              fontSize: "14px",
              fontFamily: fonts.body,
              margin: 0,
            }}
          >
            Loading your account…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      {/* CSS for animations and responsive sidebar */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 767px) {
          .customer-sidebar-desktop {
            display: none !important;
          }
          .customer-mobile-topbar {
            display: flex !important;
          }
        }
        @media (min-width: 768px) {
          .customer-sidebar-desktop {
            display: flex !important;
          }
          .customer-mobile-topbar {
            display: none !important;
          }
          .customer-mobile-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Mobile top bar with hamburger */}
      <div
        className="customer-mobile-topbar"
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          borderBottom: `1px solid ${primary[100]}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: shadows.card,
          fontFamily: fonts.body,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: gradients.primaryButton,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}
          >
            {getInitials(user.name)}
          </div>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: primary[900],
              fontFamily: fonts.body,
            }}
          >
            My Account
          </span>
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            background: "none",
            border: `1px solid ${primary[100]}`,
            borderRadius: "6px",
            padding: "6px 8px",
            cursor: "pointer",
            color: primary[500],
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Open navigation menu"
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Mobile overlay + drawer */}
      {sidebarOpen && (
        <div
          className="customer-mobile-overlay"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div
            style={{
              position: "relative",
              width: "280px",
              height: "100%",
              backgroundColor: "#ffffff",
              boxShadow: shadows.cardHover,
              animation: "slideInLeft 0.22s ease-out",
              display: "flex",
              flexDirection: "column",
              zIndex: 51,
            }}
          >
            {/* Close button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                padding: "12px 16px",
                borderBottom: `1px solid ${primary[100]}`,
              }}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: earth[400],
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  borderRadius: "4px",
                }}
                aria-label="Close navigation menu"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <SidebarContent user={user} pathname={pathname} handleLogout={handleLogout} unreadCount={unreadCount} />
          </div>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: "calc(100vh - 200px)",
          backgroundColor: bg.primary,
          fontFamily: fonts.body,
        }}
      >
        {/* Desktop Sidebar */}
        <aside
          className="customer-sidebar-desktop"
          style={{
            width: "240px",
            minWidth: "240px",
            backgroundColor: "#ffffff",
            borderRight: `1px solid ${primary[100]}`,
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
            boxShadow: "1px 0 4px rgba(1, 63, 71, 0.04)",
          }}
        >
          <SidebarContent user={user} pathname={pathname} handleLogout={handleLogout} unreadCount={unreadCount} />
        </aside>

        {/* Content area */}
        <main
          style={{
            flex: 1,
            backgroundColor: "#ffffff",
            overflowY: "auto",
            padding: "24px",
            fontFamily: fonts.body,
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>
    </>
  )
}
