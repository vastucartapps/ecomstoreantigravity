"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Heart, ShoppingBag, User, Menu, X, Bell, ExternalLink, Truck, RotateCcw, ShieldCheck, Sparkles, Check } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useCart } from "@/providers/cart-provider"
import { useWishlist } from "@/providers/wishlist-provider"
import { useAnnouncement, useBranding, useStorefrontFooter, useConsultationsEnabled, useOperationalPolicies, useStorefrontRegion } from "@/providers/announcement-provider"
import { CartDrawer } from "@/components/storefront/cart/CartDrawer"
import { CLUSTER_SITES } from "@/lib/cluster-sites"
import { primary, secondary, earth, bg, gradients, fonts } from "./theme"

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

interface StorefrontShellProps {
  children: React.ReactNode
  categories?: { name: string; handle: string; image_url?: string }[]
}

// Ecosystem cards source: lib/cluster-sites.ts (CLUSTER_SITES) — single
// source of truth shared with site-schema.ts, robots.ts, and the storefront
// layout's DNS-prefetch list. Editing this file does NOT change the cards.

/**
 * Inline newsletter subscribe form. Posts to the existing /store/newsletter
 * endpoint, which dedupes and syncs to Listmonk. Fails open: any backend
 * error is swallowed and the user still sees the success state — newsletter
 * sign-up should never block the footer UX.
 */
function FooterNewsletterForm() {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "submitting" | "done">("idle")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes("@") || state !== "idle") return
    setState("submitting")
    try {
      await fetch(`${BACKEND_URL}/store/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        body: JSON.stringify({ email }),
      })
    } catch {}
    setState("done")
  }

  if (state === "done") {
    return (
      <div
        className="flex items-center gap-2 text-sm rounded-md px-4 py-3"
        style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "#a7f3d0", fontFamily: fonts.body }}
      >
        <Check size={16} />
        <span>Subscribed. Check your inbox to confirm.</span>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2 w-full sm:w-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 sm:w-64 px-4 py-2.5 rounded-md text-sm outline-none focus:ring-2"
        style={{
          backgroundColor: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
          fontFamily: fonts.body,
        }}
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity disabled:opacity-60"
        style={{
          background: gradients.secondaryButton,
          color: "white",
          fontFamily: fonts.body,
        }}
      >
        {state === "submitting" ? "..." : "Subscribe"}
      </button>
    </form>
  )
}

export default function StorefrontShell({ children, categories = [] }: StorefrontShellProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { itemCount: cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const {
    text: announcementText,
    link: announcementLink,
    linkText: announcementLinkText,
    bgColor: announcementBgColor,
    textColor: announcementTextColor,
    isActive: announcementActive,
    dismiss,
  } = useAnnouncement()
  const branding = useBranding()
  const footerConfig = useStorefrontFooter()
  const consultationsEnabled = useConsultationsEnabled()
  const ops = useOperationalPolicies()
  const region = useStorefrontRegion()
  // Region-aware free-shipping threshold — USD visitors see "$50" instead
  // of "₹999" (which they can never trigger because they pay in USD).
  const freeShippingDisplay =
    region === "INTERNATIONAL"
      ? `$${ops.freeShippingThresholdUsd.toLocaleString("en-US")}`
      : `₹${ops.freeShippingThresholdInr.toLocaleString("en-IN")}`
  const freeShippingScope = region === "INTERNATIONAL" ? "worldwide" : "across India"

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [hoveredCat, setHoveredCat] = useState<{ name: string; handle: string; image_url?: string } | null>(null)
  const collectionsRef = useRef<HTMLDivElement>(null)
  const collectionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const FALLBACK_HERO = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&h=500&fit=crop"
  const [searchQuery, setSearchQuery] = useState("")
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [recentNotifs, setRecentNotifs] = useState<any[]>([])
  const notifRef = useRef<HTMLDivElement>(null)

  // Poll unread notification count every 60s (logged-in only)
  useEffect(() => {
    if (!user) return
    const fetchCount = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/store/customers/me/notifications?limit=5`, {
          headers: customerHeaders(),
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          setNotifCount(data.unread_count || 0)
          setRecentNotifs(data.notifications || [])
        }
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 60000)
    return () => clearInterval(interval)
  }, [user])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await fetch(`${BACKEND_URL}/store/customers/me/notifications/mark-read`, {
        method: "POST",
        headers: { ...customerHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      })
      setNotifCount(0)
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileSearchOpen(false)
    }
  }

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? ""
  const userName = user?.name?.split(" ")[0] ?? ""

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: bg.primary, fontFamily: fonts.body }}
    >
      {/* Announcement Ribbon */}
      {announcementActive && announcementText && (
        <div
          className="relative flex items-center justify-center px-8 py-2 text-sm sm:px-10"
          style={{
            background: announcementBgColor,
            color: announcementTextColor,
          }}
        >
          <div className="text-center">
            <span>{announcementText}</span>
            {announcementLink && (
              <>
                {" "}
                <a
                  href={announcementLink}
                  className="underline underline-offset-2 hover:opacity-80 transition-opacity font-semibold"
                  style={{ color: announcementTextColor }}
                >
                  {announcementLinkText || "Learn more"}
                </a>
              </>
            )}
          </div>
          <button
            onClick={dismiss}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:opacity-70 transition-opacity"
            aria-label="Dismiss announcement"
          >
            <X size={14} style={{ color: announcementTextColor }} />
          </button>
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          borderColor: "rgba(232, 221, 212, 0.6)",
          backgroundColor: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: hamburger + logo grouped so logo stays left-aligned on mobile */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                style={{ color: primary[500] }}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Logo */}
              <Link
                href="/"
                className="flex items-center gap-2"
                aria-label={`${branding.storeName} Home`}
              >
                <img
                  src={branding.logoUrl || "/VastuCartLogo.png"}
                  alt={`${branding.storeName} Logo`}
                  className="h-9 w-9 object-contain"
                />
                <span
                  className="inline font-bold text-xl tracking-tight"
                  style={{ fontFamily: fonts.heading, color: primary[500] }}
                >
                  {branding.storeName}
                </span>
              </Link>
            </div>

            {/* Desktop search */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-xl items-center relative"
            >
              <div className="relative w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search size={17} color={earth[400]} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search crystals, yantras, rudraksha..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border-2 outline-none text-sm transition-colors"
                  style={{
                    borderColor: "#d4c4b8",
                    backgroundColor: bg.primary,
                    color: primary[500],
                    fontFamily: fonts.body,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primary[500]
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#d4c4b8"
                  }}
                />
              </div>
            </form>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile search toggle */}
              <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                style={{ color: primary[500] }}
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Wishlist — hidden on mobile (accessible via hamburger menu Quick Links) */}
              <Link
                href="/wishlist"
                className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-lg transition-opacity hover:opacity-70"
                aria-label="Wishlist"
              >
                <Heart size={20} style={{ color: primary[500] }} />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                    style={{ background: gradients.secondaryButton, fontFamily: fonts.body }}
                  >
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Notification Bell (logged-in only) */}
              {user && (
                <div ref={notifRef} className="relative">
                  <button
                    onClick={() => setNotifOpen((v) => !v)}
                    className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-opacity hover:opacity-70"
                    aria-label="Notifications"
                  >
                    <Bell size={20} style={{ color: primary[500] }} />
                    {notifCount > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                        style={{ background: "#EF4444", fontFamily: fonts.body }}
                      >
                        {notifCount > 9 ? "9+" : notifCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {notifOpen && (
                    <div
                      className="absolute right-0 top-11 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl shadow-xl overflow-hidden"
                      style={{ background: "#fff", border: "1px solid #f0ebe4", zIndex: 90 }}
                    >
                      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #f0ebe4" }}>
                        <p className="text-sm font-semibold" style={{ color: earth[700] }}>Notifications</p>
                        {notifCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs font-medium" style={{ color: primary[500] }}>
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                        {recentNotifs.length === 0 ? (
                          <div className="py-8 text-center">
                            <Bell size={28} style={{ color: earth[200], margin: "0 auto 8px" }} />
                            <p className="text-xs" style={{ color: earth[400] }}>No notifications yet</p>
                          </div>
                        ) : (
                          recentNotifs.map((n: any, idx: number) => (
                            <div
                              key={n.id}
                              className="px-4 py-3"
                              style={{
                                borderBottom: idx < recentNotifs.length - 1 ? "1px solid #f0ebe4" : "none",
                                background: n.is_read ? "transparent" : `${primary[50]}80`,
                              }}
                            >
                              <p className="text-xs font-semibold" style={{ color: earth[700] }}>{n.title}</p>
                              <p className="text-xs mt-0.5 line-clamp-2" style={{ color: earth[400] }}>{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-3" style={{ borderTop: "1px solid #f0ebe4" }}>
                        <Link
                          href="/account/notifications"
                          className="block text-xs font-medium text-center hover:opacity-70"
                          style={{ color: primary[500] }}
                          onClick={() => setNotifOpen(false)}
                        >
                          View all notifications →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cart */}
              <button
                onClick={() => setCartDrawerOpen(true)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-opacity hover:opacity-70"
                aria-label="Shopping cart"
              >
                <ShoppingBag size={20} style={{ color: primary[500] }} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-xs font-bold px-1"
                    style={{ background: gradients.secondaryButton, fontFamily: fonts.body }}
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {/* User */}
              {user ? (
                <Link
                  href="/account"
                  className="flex items-center gap-2 ml-1 rounded-lg px-2 py-1 transition-opacity hover:opacity-70"
                  aria-label="Account"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: gradients.primaryButton, fontFamily: fonts.body }}
                  >
                    {userInitial}
                  </div>
                  <span
                    className="hidden sm:block text-sm font-medium max-w-[80px] truncate"
                    style={{ color: primary[500], fontFamily: fonts.body }}
                  >
                    {userName}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 ml-1 rounded-lg px-2 py-1 transition-opacity hover:opacity-70"
                  aria-label="Login"
                >
                  <User size={20} style={{ color: primary[500] }} />
                  <span
                    className="hidden sm:block text-sm font-medium"
                    style={{ color: primary[500], fontFamily: fonts.body }}
                  >
                    Login
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div
            className="lg:hidden border-t px-4 py-3"
            style={{ borderColor: "#e8ddd4", backgroundColor: bg.primary }}
          >
            <form onSubmit={handleSearch} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Search size={16} color={earth[400]} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crystals, yantras, rudraksha..."
                autoFocus
                className="w-full pl-9 pr-4 py-2 rounded-xl border-2 outline-none text-sm"
                style={{
                  borderColor: primary[500],
                  backgroundColor: "#ffffff",
                  color: primary[500],
                  fontFamily: fonts.body,
                }}
              />
            </form>
          </div>
        )}

        {/* Navigation + Categories bar — desktop only */}
        <nav
          className="hidden lg:block border-t"
          style={{ borderColor: "#e8ddd4", backgroundColor: "#ffffff" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center overflow-x-auto scrollbar-hide">
              {/* Main navigation links */}
              {[
                { label: "Home", href: "/" },
                { label: "Shop", href: "/search" },
                ...(consultationsEnabled ? [{ label: "Consultations", href: "/consultations" }] : []),
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((nav) => {
                const isActive = pathname === nav.href
                return (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    className="flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors relative group"
                    style={{
                      color: isActive ? secondary[500] : primary[500],
                      fontFamily: fonts.body,
                    }}
                  >
                    {nav.label}
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left"
                      style={{
                        background: gradients.accentBorder,
                        transform: isActive ? "scaleX(1)" : "scaleX(0)",
                      }}
                    />
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left group-hover:scale-x-100 scale-x-0"
                      style={{ background: gradients.accentBorder }}
                    />
                  </Link>
                )
              })}

              {/* Blog — external link */}
              <a
                href="https://blog.vastucart.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 px-4 py-3 text-sm font-semibold transition-colors relative group inline-flex items-center gap-1"
                style={{ color: primary[500], fontFamily: fonts.body }}
              >
                Blog
                <ExternalLink size={12} style={{ opacity: 0.5 }} />
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left group-hover:scale-x-100 scale-x-0"
                  style={{ background: gradients.accentBorder }}
                />
              </a>

              {/* Divider */}
              {categories.length > 0 && (
                <div
                  className="flex-shrink-0 mx-2"
                  style={{ width: "1px", height: "20px", background: earth[300] }}
                />
              )}

              {/* Collections mega-dropdown trigger */}
              {categories.length > 0 && (
                <div
                  ref={collectionsRef}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => {
                    if (collectionsTimerRef.current) clearTimeout(collectionsTimerRef.current)
                    setCollectionsOpen(true)
                  }}
                  onMouseLeave={() => {
                    collectionsTimerRef.current = setTimeout(() => setCollectionsOpen(false), 120)
                  }}
                >
                  <button
                    className="flex items-center gap-1 px-4 py-3 text-sm font-semibold transition-colors relative group"
                    style={{
                      color: collectionsOpen ? secondary[500] : primary[500],
                      fontFamily: fonts.body,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Collections
                    <svg
                      width="12" height="12" viewBox="0 0 12 12" fill="none"
                      style={{
                        transition: "transform 0.2s",
                        transform: collectionsOpen ? "rotate(180deg)" : "rotate(0deg)",
                        opacity: 0.6,
                      }}
                    >
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span
                      className="absolute bottom-0 left-0 right-0 h-0.5 transition-transform origin-left"
                      style={{
                        background: gradients.accentBorder,
                        transform: collectionsOpen ? "scaleX(1)" : "scaleX(0)",
                      }}
                    />
                  </button>

                  {/* Mega dropdown panel — two-column */}
                  {collectionsOpen && (
                    <div
                      className="fixed left-0 right-0 z-50 shadow-2xl border-t"
                      style={{
                        top: collectionsRef.current
                          ? collectionsRef.current.closest("nav")!.getBoundingClientRect().bottom + "px"
                          : "auto",
                        backgroundColor: "#ffffff",
                        borderColor: "#e8ddd4",
                      }}
                      onMouseEnter={() => {
                        if (collectionsTimerRef.current) clearTimeout(collectionsTimerRef.current)
                        setCollectionsOpen(true)
                      }}
                      onMouseLeave={() => {
                        collectionsTimerRef.current = setTimeout(() => {
                          setCollectionsOpen(false)
                          setHoveredCat(null)
                        }, 120)
                      }}
                    >
                      <div className="max-w-7xl mx-auto flex" style={{ minHeight: 340 }}>

                        {/* Left — category list */}
                        <div className="flex-1 px-8 py-8 overflow-y-auto" style={{ maxHeight: 420 }}>
                          <p
                            className="text-xs font-semibold uppercase tracking-widest mb-5"
                            style={{ color: earth[300], fontFamily: fonts.body }}
                          >
                            Shop by Collection
                          </p>
                          <ul className="space-y-0.5">
                            {categories.map((cat) => {
                              const isActive = pathname === `/category/${cat.handle}`
                              const isHovered = hoveredCat?.handle === cat.handle
                              return (
                                <li key={cat.handle}>
                                  <Link
                                    href={`/category/${cat.handle}`}
                                    onClick={() => { setCollectionsOpen(false); setHoveredCat(null) }}
                                    onMouseEnter={() => setHoveredCat(cat)}
                                    onMouseLeave={() => setHoveredCat(null)}
                                    className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg transition-all group"
                                    style={{
                                      background: isHovered || isActive ? "rgba(1,63,71,0.06)" : "transparent",
                                      fontFamily: fonts.body,
                                    }}
                                  >
                                    <span
                                      className="text-sm font-medium truncate"
                                      style={{ color: isActive ? secondary[500] : primary[500] }}
                                    >
                                      {cat.name}
                                    </span>
                                    <svg
                                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                                      className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                                      style={{ opacity: isHovered || isActive ? 1 : 0, color: isActive ? secondary[500] : primary[400] }}
                                    >
                                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                          <div className="mt-5 pt-4 border-t" style={{ borderColor: "#e8ddd4" }}>
                            <Link
                              href="/search"
                              onClick={() => { setCollectionsOpen(false); setHoveredCat(null) }}
                              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                              style={{ color: secondary[500], fontFamily: fonts.body }}
                            >
                              Browse all products
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Link>
                          </div>
                        </div>

                        {/* Right — category image panel */}
                        <div
                          className="relative w-80 flex-shrink-0 overflow-hidden"
                          style={{ minHeight: 340 }}
                        >
                          {/* Background image */}
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                            style={{
                              backgroundImage: `url(${hoveredCat?.image_url || categories[0]?.image_url || FALLBACK_HERO})`,
                            }}
                          />
                          {/* Dark gradient overlay */}
                          <div
                            className="absolute inset-0"
                            style={{
                              background: "linear-gradient(160deg, rgba(1,63,71,0.55) 0%, rgba(1,63,71,0.82) 100%)",
                            }}
                          />
                          {/* Content */}
                          <div className="relative h-full flex flex-col justify-end p-7">
                            <p
                              className="text-xs font-semibold uppercase tracking-widest mb-2"
                              style={{ color: "rgba(255,255,255,0.55)", fontFamily: fonts.body }}
                            >
                              {hoveredCat ? "Collection" : "Featured"}
                            </p>
                            <h3
                              className="text-lg font-bold text-white leading-snug mb-3 line-clamp-2"
                              style={{ fontFamily: fonts.heading }}
                            >
                              {hoveredCat?.name || "Our Collections"}
                            </h3>
                            <Link
                              href={hoveredCat ? `/category/${hoveredCat.handle}` : "/search"}
                              onClick={() => { setCollectionsOpen(false); setHoveredCat(null) }}
                              className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                              style={{ color: "rgba(255,255,255,0.9)", fontFamily: fonts.body }}
                            >
                              Explore
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M3 7h8M7 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </Link>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <div
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] flex flex-col shadow-2xl overflow-y-auto"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Gradient top border */}
            <div
              className="h-1 w-full flex-shrink-0"
              style={{ background: gradients.accentBorder }}
            />

            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: "#e8ddd4" }}
            >
              <Link
                href="/"
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img
                  src={branding.logoUrl || "/VastuCartLogo.png"}
                  alt={branding.storeName}
                  className="h-8 w-8 object-contain"
                />
                <span
                  className="font-bold text-lg"
                  style={{ fontFamily: fonts.heading, color: primary[500] }}
                >
                  {branding.storeName}
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70"
                style={{ color: primary[500] }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User section */}
            <div
              className="px-5 py-4 border-b"
              style={{ borderColor: "#e8ddd4", backgroundColor: bg.primary }}
            >
              {user ? (
                <Link
                  href="/account"
                  className="flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0"
                    style={{ background: gradients.primaryButton }}
                  >
                    {userInitial}
                  </div>
                  <div>
                    <div
                      className="font-semibold text-sm"
                      style={{ color: primary[500], fontFamily: fonts.body }}
                    >
                      {user?.name}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: earth[400], fontFamily: fonts.body }}
                    >
                      View Account
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <p
                    className="text-sm"
                    style={{ color: earth[600], fontFamily: fonts.body }}
                  >
                    Welcome! Sign in to your account.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: gradients.primaryButton, fontFamily: fonts.body }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login / Register
                  </Link>
                </div>
              )}
            </div>

            {/* Navigate */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "#e8ddd4" }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: earth[400], fontFamily: fonts.body }}
              >
                Navigate
              </p>
              <ul className="space-y-1">
                {[
                  { label: "Home", href: "/" },
                  { label: "Shop", href: "/search" },
                  ...(consultationsEnabled ? [{ label: "Consultations", href: "/consultations" }] : []),
                  { label: "About Us", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: primary[500], fontFamily: fonts.body }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="https://blog.vastucart.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                    style={{ color: primary[500], fontFamily: fonts.body }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Blog
                    <ExternalLink size={12} style={{ opacity: 0.5 }} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="px-5 py-4 border-b" style={{ borderColor: "#e8ddd4" }}>
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: earth[400], fontFamily: fonts.body }}
                >
                  Shop by Category
                </p>
                <ul className="space-y-1">
                  {categories.map((cat) => (
                    <li key={cat.handle}>
                      <Link
                        href={`/category/${cat.handle}`}
                        className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
                        style={{
                          color: primary[500],
                          fontFamily: fonts.body,
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick links */}
            <div className="px-5 py-4 flex-1">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: earth[400], fontFamily: fonts.body }}
              >
                Quick Links
              </p>
              <ul className="space-y-1">
                {[
                  { label: "My Orders", href: "/account/orders" },
                  { label: "Track Order", href: "/track-order" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
                      style={{ color: earth[600], fontFamily: fonts.body }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/wishlist"
                    className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <Heart size={15} style={{ color: primary[500] }} />
                      Wishlist
                    </span>
                    {wishlistCount > 0 && (
                      <span
                        className="min-w-[20px] h-5 rounded-full flex items-center justify-center text-white text-xs font-bold px-1.5"
                        style={{ background: gradients.secondaryButton, fontFamily: fonts.body }}
                      >
                        {wishlistCount > 99 ? "99+" : wishlistCount}
                      </span>
                    )}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer — Mega Premium layout: trust ribbon → ecosystem cards →
          5-col mega-nav → newsletter strip → social/payments → legal bar.
          Admin-configured FooterColumn[] are spliced into the mega-nav so
          saved CMS links continue to work. */}
      <footer className="text-white" style={{ background: gradients.footer }}>
        {/* Gradient accent border at top */}
        <div className="h-1 w-full" style={{ background: gradients.accentBorder }} />

        {/* ── 1. Trust ribbon ─────────────────────────────────────────── */}
        <section className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { Icon: Truck,        title: "Free Shipping",                       desc: `On orders above ${freeShippingDisplay} ${freeShippingScope}.` },
              { Icon: RotateCcw,    title: `${ops.returnWindowDays}-Day Returns`, desc: `Raise a return within ${ops.returnWindowDays} days of delivery.` },
              { Icon: ShieldCheck,  title: "Secure Checkout",                     desc: region === "INTERNATIONAL" ? "Stripe · PayPal · cards." : "Razorpay · Stripe · UPI · COD." },
              { Icon: Sparkles,     title: "Authentic Sourcing",                  desc: "Energised by Vedic priests, every piece." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8c97a" }}
                >
                  <Icon size={18} />
                </div>
                <div>
                  <h5 className="text-sm font-semibold" style={{ fontFamily: fonts.heading }}>{title}</h5>
                  <p className="text-xs opacity-65 mt-0.5" style={{ fontFamily: fonts.body }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Ecosystem discovery cards ────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-2">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: fonts.heading }}>
            {footerConfig.ecosystemTitle?.trim() || `Explore the ${branding.storeName} Ecosystem`}
          </h2>
          <p className="text-sm opacity-70 mt-1 max-w-xl" style={{ fontFamily: fonts.body }}>
            {footerConfig.ecosystemIntro?.trim() || `${CLUSTER_SITES.length} connected platforms covering every dimension of Vedic life — from daily Panchang to wedding muhurta.`}
          </p>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CLUSTER_SITES.map((site) => {
              const inner = (
                <>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ backgroundColor: site.iconBg, color: site.iconFg || "#fff" }}
                  >
                    {site.glyph}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: fonts.heading }}>
                      <span className="truncate">{site.name}</span>
                      {site.badge && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
                          style={{ backgroundColor: secondary[500], color: "white", fontFamily: fonts.body }}
                        >
                          {site.badge}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs opacity-65 mt-0.5 line-clamp-2" style={{ fontFamily: fonts.body }}>
                      {site.description}
                    </p>
                  </div>
                </>
              )
              const className =
                "flex gap-3.5 items-start p-4 rounded-xl transition-all hover:-translate-y-0.5"
              const style = {
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              } as React.CSSProperties
              const href = site.isCurrent ? "/" : site.url
              return site.isCurrent ? (
                <Link key={site.slug} href={href} className={className} style={style}>
                  {inner}
                </Link>
              ) : (
                <a
                  key={site.slug}
                  href={href}
                  target="_blank"
                  rel="noopener"
                  className={className}
                  style={style}
                >
                  {inner}
                </a>
              )
            })}
          </div>
        </section>

        {/* ── 3. Mega-nav columns: Brand | Admin × 2 | Explore | Account ─ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">

            {/* Brand column — spans full width on mobile */}
            <div className="col-span-2 md:col-span-1 space-y-5">
              <Link href="/" aria-label={`${branding.storeName} home`} className="inline-flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: "white",
                    padding: "4px",
                    boxShadow: "0 4px 14px -4px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,161,60,0.18)",
                  }}
                >
                  <img
                    src={branding.logoUrl || "/VastuCartLogo.png"}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </span>
                <span style={{ fontFamily: fonts.heading, lineHeight: 1 }}>
                  {branding.storeName === "VastuCart" ? (
                    <span className="block text-[1.4rem] font-semibold">
                      Vastu<span style={{ color: "#e8c97a" }}>Cart</span>
                    </span>
                  ) : (
                    <span className="block text-[1.4rem] font-semibold">{branding.storeName}</span>
                  )}
                </span>
              </Link>
              <p
                className="text-sm leading-relaxed opacity-75"
                style={{ fontFamily: fonts.body }}
              >
                {branding.tagline}
              </p>
              <div className="space-y-1.5">
                {branding.contactEmail && (
                  <a
                    href={`mailto:${branding.contactEmail}`}
                    className="block text-xs opacity-70 hover:opacity-100 transition-opacity"
                    style={{ fontFamily: fonts.body }}
                  >
                    {branding.contactEmail}
                  </a>
                )}
                {branding.contactPhone && (
                  <a
                    href={`tel:${branding.contactPhone.replace(/\s/g, "")}`}
                    className="block text-xs opacity-70 hover:opacity-100 transition-opacity"
                    style={{ fontFamily: fonts.body }}
                  >
                    {branding.contactPhone}
                  </a>
                )}
              </div>
            </div>

            {/* Admin-configured columns — first 2 slots in main grid */}
            {footerConfig.columns.slice(0, 2).map((col) => (
              <div key={col.title} className="space-y-4">
                <h3
                  className="font-semibold text-xs uppercase tracking-widest opacity-90"
                  style={{ fontFamily: fonts.heading }}
                >
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((lnk) => (
                    <li key={lnk.url}>
                      <Link
                        href={lnk.url}
                        className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                        style={{ fontFamily: fonts.body }}
                      >
                        {lnk.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Ecosystem column — VastuCart services & discovery links */}
            <div className="space-y-4">
              <h3
                className="font-semibold text-xs uppercase tracking-widest opacity-90"
                style={{ fontFamily: fonts.heading }}
              >
                Explore
              </h3>
              <ul className="space-y-2.5">
                {[
                  ...(consultationsEnabled ? [{ label: "Vastu Consultation", href: "/consultations" }] : []),
                  { label: "Blog & Articles", href: "/blog" },
                  { label: "Gift Cards", href: "/gift-cards" },
                  { label: "Loyalty Rewards", href: "/account/loyalty" },
                  { label: "New Arrivals", href: "/category/new-arrivals" },
                  { label: "Offers & Deals", href: "/offers" },
                  { label: "Bulk Orders", href: "/bulk-orders" },
                ].map((lnk) => (
                  <li key={lnk.href}>
                    <Link
                      href={lnk.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ fontFamily: fonts.body }}
                    >
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer account quick links */}
            <div className="space-y-4">
              <h3
                className="font-semibold text-xs uppercase tracking-widest opacity-90"
                style={{ fontFamily: fonts.heading }}
              >
                My Account
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Dashboard", href: "/account" },
                  { label: "My Orders", href: "/account/orders" },
                  { label: "Wishlist", href: "/account/wishlist" },
                  { label: "My Bookings", href: "/account/bookings" },
                  { label: "Loyalty Points", href: "/account/loyalty" },
                  { label: "Address Book", href: "/account/addresses" },
                  { label: "Contact Support", href: "/account/support" },
                ].map((lnk) => (
                  <li key={lnk.href}>
                    <Link
                      href={lnk.href}
                      className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                      style={{ fontFamily: fonts.body }}
                    >
                      {lnk.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Overflow admin columns — rendered when admin configures more than 2 */}
          {footerConfig.columns.length > 2 && (
            <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-10">
              {footerConfig.columns.slice(2).map((col) => (
                <div key={col.title} className="space-y-4">
                  <h3
                    className="font-semibold text-xs uppercase tracking-widest opacity-90"
                    style={{ fontFamily: fonts.heading }}
                  >
                    {col.title}
                  </h3>
                  <ul className="space-y-2.5">
                    {col.links.map((lnk) => (
                      <li key={lnk.url}>
                        <Link
                          href={lnk.url}
                          className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                          style={{ fontFamily: fonts.body }}
                        >
                          {lnk.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── 4. Newsletter strip ─────────────────────────────────────── */}
        <section
          className="border-t border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(0,0,0,0.18)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h4 className="text-base font-semibold" style={{ fontFamily: fonts.heading }}>
                {footerConfig.newsletterTitle || "Stay in the loop"}
              </h4>
              <p className="text-xs opacity-65 mt-0.5" style={{ fontFamily: fonts.body }}>
                {footerConfig.newsletterSubtitle || "Weekly Vedic insights, ritual guides, and members-only drops."}
              </p>
            </div>
            <FooterNewsletterForm />
          </div>
        </section>

        {/* ── 5. Social + payments strip ──────────────────────────────── */}
        <section
          className="border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(0,0,0,0.18)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-6 flex-wrap">
            {footerConfig.showSocialLinks && (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.18em] opacity-50" style={{ fontFamily: fonts.body }}>
                  Connect
                </span>
                {([
                  ["instagram", "Instagram", "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 5.18a4.66 4.66 0 100 9.32 4.66 4.66 0 000-9.32zm6.06-.27a1.09 1.09 0 11-2.18 0 1.09 1.09 0 012.18 0zM12 9.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"],
                  ["facebook", "Facebook", "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0022 12z"],
                  ["twitter", "X", "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.16 17.52h1.833L7.084 4.126H5.117L17.084 19.77z"],
                  ["pinterest", "Pinterest", "M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.85 6.36 9.3-.09-.79-.17-2 .04-2.86.19-.78 1.21-4.99 1.21-4.99s-.31-.62-.31-1.53c0-1.43.83-2.5 1.86-2.5.88 0 1.31.66 1.31 1.45 0 .88-.56 2.2-.85 3.43-.24 1.02.51 1.85 1.52 1.85 1.83 0 3.23-1.93 3.23-4.71 0-2.46-1.77-4.18-4.3-4.18-2.93 0-4.65 2.2-4.65 4.47 0 .89.34 1.84.77 2.36.08.1.09.19.07.29-.08.32-.25 1.02-.28 1.16-.04.19-.15.23-.34.14-1.27-.59-2.06-2.45-2.06-3.94 0-3.21 2.33-6.16 6.71-6.16 3.52 0 6.26 2.51 6.26 5.86 0 3.5-2.21 6.32-5.27 6.32-1.03 0-2-.54-2.33-1.17l-.63 2.4c-.23.88-.85 1.99-1.26 2.66.95.29 1.96.45 3.01.45 5.52 0 10-4.48 10-10S17.52 2 12 2z"],
                  ["youtube", "YouTube", "M21.58 7.19c-.23-.87-.91-1.55-1.78-1.78C18.25 5 12 5 12 5s-6.25 0-7.8.41c-.87.23-1.55.91-1.78 1.78C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.87.91 1.55 1.78 1.78C5.75 19 12 19 12 19s6.25 0 7.8-.41c.87-.23 1.55-.91 1.78-1.78C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"],
                  ["threads", "Threads", "M12.18 2C6.84 2.02 3.5 5.31 3.5 12c0 6.7 3.36 9.99 8.7 10h.04c2.43 0 4.45-.7 5.85-2.04 1.84-1.74 1.78-3.97 1.21-5.34-.42-1-1.18-1.83-2.18-2.4.18-.92.16-1.78-.07-2.55-.45-1.5-1.74-2.6-3.55-3.02-1.4-.32-3.06-.13-4.42.5-.95.43-1.55 1.04-1.78 1.79.31.27.69.5 1.13.69.45-.94 1.4-1.41 2.74-1.41 1.96 0 3.06.95 3.46 2.69-.85-.21-1.79-.32-2.78-.32-2.74 0-4.7 1.31-4.7 3.53 0 1.93 1.62 3.31 3.95 3.31 1.96 0 3.45-.85 4.21-2.42.62.36 1.06.85 1.27 1.43.34.94-.04 2.05-1.03 3-1.06 1-2.65 1.55-4.6 1.55-4.16 0-6.78-2.41-6.78-7.99 0-5.59 2.62-7.99 6.79-8 3.62 0 5.97 1.81 6.5 5.05.42.07.83.2 1.21.4-.61-3.79-3.39-6.04-7.71-6.06zm-.21 13.31c-1.18 0-2.06-.5-2.06-1.32 0-.92 1.04-1.39 2.55-1.39.85 0 1.65.1 2.36.27-.42 1.55-1.42 2.44-2.85 2.44z"],
                  ["etsy", "Etsy", "M9.16 4.42v6.36s2.27 0 3.48-.08c.96-.16 1.13-.24 1.29-1.21l.24-1.05h.81L14.9 12l.08 3.71h-.8l-.25-.96c-.16-.97-.4-1.05-1.28-1.21-1.13-.08-3.48-.08-3.48-.08v5.32c0 1.05.49 1.45 1.61 1.45h3.4c1.05 0 2.1-.08 2.66-1.45l.65-1.69h.73l-.4 4.11H6.3v-.81h.97c1.13 0 1.45-.32 1.45-1.13V6.84c0-.81-.32-1.13-1.45-1.13H6.3V4.9h11.34l.16 3.55h-.73l-.24-.81c-.32-1.13-.81-1.86-2.5-1.86H9.16z"],
                  ["amazon", "Amazon", "M14.27 14.34a8.7 8.7 0 01-3.74.78c-3.04 0-5.78-1.13-7.85-3.01-.16-.15 0-.35.18-.24a13.04 13.04 0 006.85 1.81c1.66 0 3.5-.34 5.18-1.06.25-.1.46.17.21.34zm.92-1.05c-.21-.27-1.4-.13-1.94-.07-.16.02-.18-.12-.04-.22.95-.67 2.5-.48 2.69-.25.18.23-.05 1.78-.94 2.52-.14.11-.27.05-.21-.1.21-.49.66-1.6.44-1.88zM7.04 16.29c-1.65 0-3.2-.61-4.34-1.62-.09-.08-.01-.18.1-.12 1.27.74 2.85 1.18 4.48 1.18 1.06 0 2.23-.22 3.31-.68.16-.07.3.11.13.23a8.6 8.6 0 01-3.68.99zm9.55-7.08c-1.18 0-2.04 1.07-2.04 2.42 0 1.55.86 2.6 2.04 2.6 1.19 0 2.05-1.05 2.05-2.6 0-1.45-.91-2.42-2.05-2.42zm0 4.13c-.63 0-.84-.56-.84-1.71 0-1.05.21-1.51.84-1.51.62 0 .85.46.85 1.51 0 1.15-.23 1.71-.85 1.71z"],
                ] as const).map(([key, label, path]) => {
                  const url = (branding.socialLinks as Record<string, string | undefined>)?.[key]
                  if (!url) return null
                  return (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-md flex items-center justify-center transition-all hover:opacity-100 opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                      aria-label={label}
                      title={label}
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={path} />
                      </svg>
                    </a>
                  )
                })}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-[0.18em] opacity-50" style={{ fontFamily: fonts.body }}>
                We accept
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["VISA", "Mastercard", "UPI", "Razorpay", "Stripe", "PayPal", "COD"].map((method) => (
                  <span
                    key={method}
                    className="px-2 py-1 rounded text-[10px] font-bold tracking-wide opacity-75"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#ffffff",
                      fontFamily: fonts.body,
                    }}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Bottom legal bar: copyright + inline links ───────────── */}
        <section style={{ backgroundColor: "rgba(0,0,0,0.18)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs opacity-55" style={{ fontFamily: fonts.body }}>
              {footerConfig.copyrightText}
            </p>
            <nav className="flex items-center gap-x-5 gap-y-2 flex-wrap">
              {[
                { label: "Privacy", href: "/privacy-policy" },
                { label: "Terms", href: "/terms" },
                { label: "Refund", href: "/refund-policy" },
                { label: "Shipping", href: "/shipping-policy" },
                { label: "Cookies", href: "/cookie-policy" },
                { label: "Disclaimer", href: "/disclaimer" },
                { label: "Acceptable Use", href: "/acceptable-use" },
                { label: "IP", href: "/intellectual-property" },
              ].map((lnk) => (
                <Link
                  key={lnk.href}
                  href={lnk.href}
                  className="text-xs opacity-55 hover:opacity-90 transition-opacity"
                  style={{ fontFamily: fonts.body }}
                >
                  {lnk.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
