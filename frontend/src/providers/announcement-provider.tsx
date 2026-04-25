"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SocialLinks {
  instagram?: string
  facebook?: string
  youtube?: string
  twitter?: string
  pinterest?: string
  threads?: string
  etsy?: string
  amazon?: string
}

export interface BrandingValue {
  storeName: string
  tagline: string
  logoUrl: string
  faviconUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  socialLinks: SocialLinks
  gift_card_image_url: string
}

export interface FooterLink { label: string; url: string }
export interface FooterColumn { title: string; links: FooterLink[] }
export interface FooterValue {
  columns: FooterColumn[]
  copyrightText: string
  showSocialLinks: boolean
}

interface StorefrontContextValue {
  // Announcement
  text: string | null
  link: string | null
  linkText: string | null
  bgColor: string
  textColor: string
  isActive: boolean
  isDismissed: boolean
  dismiss: () => void
  // Branding
  branding: BrandingValue
  // Footer
  footer: FooterValue
  // Feature flags
  consultationsRouteEnabled: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BRANDING: BrandingValue = {
  storeName: "VastuCart",
  tagline: "Sacred Essentials for Your Spiritual Journey",
  logoUrl: "/VastuCartLogo.png",
  faviconUrl: "/favicon.ico",
  contactEmail: "support@vastucart.com",
  contactPhone: "+91 98765 43210",
  address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  socialLinks: {
    instagram: "https://www.instagram.com/vastucart/",
    facebook: "https://www.facebook.com/vastucartindia",
    youtube: "https://youtube.com/vastucart",
    twitter: "https://x.com/vastucart",
    pinterest: "https://in.pinterest.com/vastucart/",
    threads: "https://www.threads.com/@vastucart",
    etsy: "https://vastucart.etsy.com",
    amazon: "https://www.amazon.in/s?k=vastucart",
  },
  gift_card_image_url: "",
}

const DEFAULT_FOOTER: FooterValue = {
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "Home", url: "/" },
        { label: "All Products", url: "/search" },
        { label: "Best Sellers", url: "/collections/best-sellers" },
        { label: "New Arrivals", url: "/collections/new-arrivals" },
      ],
    },
    {
      title: "Customer Care",
      links: [
        { label: "Contact Us", url: "/contact" },
        { label: "Shipping Policy", url: "/shipping-policy" },
        { label: "Refund & Returns", url: "/refund-policy" },
        { label: "FAQs", url: "/faq" },
      ],
    },
    {
      title: "About",
      links: [
        { label: "Our Story", url: "/about" },
        { label: "Privacy Policy", url: "/privacy-policy" },
        { label: "Terms & Conditions", url: "/terms" },
      ],
    },
  ],
  copyrightText: `© ${new Date().getFullYear()} VastuCart. All rights reserved.`,
  showSocialLinks: true,
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StorefrontContext = createContext<StorefrontContextValue | null>(null)
const DISMISSED_KEY = "vastucart_announcement_dismissed"

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  // Announcement
  const [text, setText] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [linkText, setLinkText] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState("#013f47")
  const [textColor, setTextColor] = useState("#ffffff")
  const [serverActive, setServerActive] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  // Branding + footer + feature flags
  const [branding, setBranding] = useState<BrandingValue>(DEFAULT_BRANDING)
  const [footer, setFooter] = useState<FooterValue>(DEFAULT_FOOTER)
  const [consultationsRouteEnabled, setConsultationsRouteEnabled] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) {
      setIsDismissed(true)
    }

    const fetchConfig = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/store/storefront-config`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        })
        if (!res.ok) return
        const data = await res.json()
        const config = data.config
        if (!config) return

        // Announcement
        const ann = config.announcement
        if (ann?.isActive && ann.message) {
          const now = new Date()
          let scheduleValid = true
          if (ann.schedule?.startDate) scheduleValid = scheduleValid && now >= new Date(ann.schedule.startDate)
          if (ann.schedule?.endDate) scheduleValid = scheduleValid && now <= new Date(ann.schedule.endDate + "T23:59:59")
          if (scheduleValid) {
            setText(ann.message)
            setLink(ann.linkUrl || null)
            setLinkText(ann.linkText || null)
            setBgColor(ann.bgColor || "#013f47")
            setTextColor(ann.textColor || "#ffffff")
            setServerActive(true)
          }
        }

        // Branding
        if (config.branding) {
          setBranding({
            ...DEFAULT_BRANDING,
            ...config.branding,
            socialLinks: { ...DEFAULT_BRANDING.socialLinks, ...(config.branding.socialLinks || {}) },
          })
        }

        // Footer
        if (config.footerConfig) {
          setFooter({
            columns: config.footerConfig.columns?.length
              ? config.footerConfig.columns
              : DEFAULT_FOOTER.columns,
            copyrightText: config.footerConfig.copyrightText || DEFAULT_FOOTER.copyrightText,
            showSocialLinks: config.footerConfig.showSocialLinks ?? true,
          })
        }

        // Consultation feature flag
        if (config.consultationConfig) {
          setConsultationsRouteEnabled(config.consultationConfig.consultationsRouteEnabled ?? true)
        }
      } catch {
        // Config unavailable — use defaults silently
      }
    }

    fetchConfig()
  }, [])

  const dismiss = () => {
    setIsDismissed(true)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISSED_KEY, "1")
    }
  }

  return (
    <StorefrontContext.Provider
      value={{
        text,
        link,
        linkText,
        bgColor,
        textColor,
        isActive: serverActive && !!text && !isDismissed,
        isDismissed,
        dismiss,
        branding,
        footer,
        consultationsRouteEnabled,
      }}
    >
      {children}
    </StorefrontContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAnnouncement() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useAnnouncement must be used within AnnouncementProvider")
  return ctx
}

export function useBranding(): BrandingValue {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useBranding must be used within AnnouncementProvider")
  return ctx.branding
}

export function useStorefrontFooter(): FooterValue {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useStorefrontFooter must be used within AnnouncementProvider")
  return ctx.footer
}

export function useConsultationsEnabled(): boolean {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useConsultationsEnabled must be used within AnnouncementProvider")
  return ctx.consultationsRouteEnabled
}
