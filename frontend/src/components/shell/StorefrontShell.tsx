"use client"

import React, { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Search, Heart, ShoppingBag, User, Menu, X, Bell, ExternalLink } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useCart } from "@/providers/cart-provider"
import { useWishlist } from "@/providers/wishlist-provider"
import { useAnnouncement, useBranding, useStorefrontFooter, useConsultationsEnabled } from "@/providers/announcement-provider"
import { CartDrawer } from "@/components/storefront/cart/CartDrawer"
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

      {/* Footer */}
      <footer
        className="text-white"
        style={{ background: gradients.footer }}
      >
        {/* Gradient accent border at top */}
        <div
          className="h-1 w-full"
          style={{ background: gradients.accentBorder }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

          {/* ── Main link grid: Brand | Admin cols | Ecosystem | My Account ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">

            {/* Brand column — spans full width on mobile */}
            <div className="col-span-2 md:col-span-1 space-y-5">
              <div className="flex items-center gap-2">
                <img
                  src={branding.logoUrl || "/VastuCartLogo.png"}
                  alt={branding.storeName}
                  className="h-10 w-10 object-contain"
                />
                <span
                  className="font-bold text-xl"
                  style={{ fontFamily: fonts.heading }}
                >
                  {branding.storeName}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed opacity-80"
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
              {footerConfig.showSocialLinks && (
                <div className="flex items-center gap-3 pt-1">
                  {branding.socialLinks?.instagram && (
                    <a
                      href={branding.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      aria-label="Instagram"
                    >
                      <svg width="17" height="17" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                  )}
                  {branding.socialLinks?.facebook && (
                    <a
                      href={branding.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      aria-label="Facebook"
                    >
                      <svg width="17" height="17" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                  )}
                  {branding.socialLinks?.youtube && (
                    <a
                      href={branding.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      aria-label="YouTube"
                    >
                      <svg width="19" height="17" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                      </svg>
                    </a>
                  )}
                  {branding.socialLinks?.twitter && (
                    <a
                      href={branding.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      aria-label="Twitter / X"
                    >
                      <svg width="16" height="16" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                  {branding.socialLinks?.pinterest && (
                    <a
                      href={branding.socialLinks.pinterest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                      aria-label="Pinterest"
                    >
                      <svg width="17" height="17" fill="white" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
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

          {/* ── Legal & Policies ─────────────────────────────────────────── */}
          <div
            className="mt-10 pt-8 border-t"
            style={{ borderColor: "rgba(255,255,255,0.12)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4 opacity-45"
              style={{ fontFamily: fonts.body }}
            >
              Legal &amp; Policies
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2.5">
              {[
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy-policy" },
                { label: "Return & Refund", href: "/refund-policy" },
                { label: "Shipping Policy", href: "/shipping-policy" },
                { label: "Disclaimer", href: "/disclaimer" },
                { label: "Cookie Policy", href: "/cookie-policy" },
                { label: "Consultation Terms", href: "/consultation-terms" },
                { label: "Intellectual Property", href: "/intellectual-property" },
                { label: "Acceptable Use", href: "/acceptable-use" },
              ].map((lnk) => (
                <Link
                  key={lnk.href}
                  href={lnk.href}
                  className="text-xs opacity-55 hover:opacity-90 transition-opacity py-0.5"
                  style={{ fontFamily: fonts.body }}
                >
                  {lnk.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Bottom bar: copyright + payment badges ───────────────────── */}
          <div
            className="mt-6 pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p
              className="text-sm opacity-60 text-center sm:text-left"
              style={{ fontFamily: fonts.body }}
            >
              {footerConfig.copyrightText}
            </p>

            <div className="flex items-center gap-2 flex-wrap justify-center">
              {["VISA", "Mastercard", "UPI", "Razorpay", "Net Banking", "COD"].map((method) => (
                <div
                  key={method}
                  className="px-2.5 py-1 rounded text-xs font-bold tracking-wide"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    color: "#ffffff",
                    fontFamily: fonts.body,
                  }}
                >
                  {method}
                </div>
              ))}
            </div>
          </div>

        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </div>
  )
}
