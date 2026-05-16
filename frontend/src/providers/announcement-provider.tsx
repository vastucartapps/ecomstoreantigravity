"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { BRAND_DEFAULTS } from "@/lib/brand-defaults"
import { CLUSTER_SITES, type ClusterSite } from "@/lib/cluster-sites"

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
  /** Empty string → storefront falls back to "Explore the {storeName} Ecosystem". */
  ecosystemTitle: string
  ecosystemIntro: string
  newsletterTitle: string
  newsletterSubtitle: string
}

/**
 * Operational policies — single source of truth for the post-purchase rules
 * that appear in the trust ribbon, homepage trust badge, refund-policy, and
 * shipping-policy pages. Editing these in admin updates every consumer.
 *
 * `freeShipping` and `cod` mirror the existing shipping_config admin (no
 * duplication — the storefront just reads them); `returnPolicy` is new.
 */
export interface OperationalPolicies {
  freeShippingThresholdInr: number
  freeShippingThresholdUsd: number
  codEnabled: boolean
  codFee: number
  codMinOrderInr: number
  codMaxOrderInr: number
  returnWindowDays: number
  inspectionDays: string
  refundDays: string
  unboxingVideoRequired: boolean
  /** Display string for default delivery time (e.g. "7-10 business days").
   *  Derived from the standard delivery estimate in shipping config. */
  defaultDeliveryDisplay: string
}

/** Geo-detected region — set by middleware via Cloudflare CF-IPCountry
 *  cookie. Drives currency-aware values in the trust ribbon, legal pages,
 *  and anywhere ₹ vs $ should differ. */
export type StorefrontRegion = "IN" | "INTERNATIONAL"

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
  // Operational policies (drives trust ribbon, homepage badge, legal pages)
  operationalPolicies: OperationalPolicies
  // Region (drives currency formatting in operational values)
  region: StorefrontRegion
  // Cluster sites — admin override or default seed
  clusterSites: readonly ClusterSite[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_BRANDING: BrandingValue = {
  storeName: BRAND_DEFAULTS.storeName,
  tagline: BRAND_DEFAULTS.tagline,
  logoUrl: BRAND_DEFAULTS.logoUrl,
  faviconUrl: BRAND_DEFAULTS.faviconUrl,
  contactEmail: BRAND_DEFAULTS.contactEmail,
  contactPhone: BRAND_DEFAULTS.contactPhone,
  address: `${BRAND_DEFAULTS.streetAddress}, ${BRAND_DEFAULTS.addressLocality}, ${BRAND_DEFAULTS.addressRegion} ${BRAND_DEFAULTS.postalCode}, India`,
  socialLinks: { ...BRAND_DEFAULTS.socialLinks },
  gift_card_image_url: "",
}

/**
 * Defaults for operational policies. These match the values in the refund-
 * policy legal page and the shipping admin defaults — keeping them aligned
 * avoids the orphan-copy problem (footer says one thing, legal page says
 * another). Admin overrides come in via /store/shipping-config and
 * /store/return-policy and replace these on first paint.
 */
const DEFAULT_OPERATIONAL_POLICIES: OperationalPolicies = {
  freeShippingThresholdInr: 999,
  freeShippingThresholdUsd: 50,
  codEnabled: true,
  codFee: 0,
  codMinOrderInr: 500,
  codMaxOrderInr: 25000,
  returnWindowDays: 7,
  inspectionDays: "3-5",
  refundDays: "7-10",
  unboxingVideoRequired: true,
  defaultDeliveryDisplay: "7-10 business days",
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
      ],
    },
    {
      title: "About",
      links: [
        { label: "Our Story", url: "/about" },
        { label: "Privacy Policy", url: "/privacy-policy" },
        { label: "Terms & Conditions", url: "/terms" },
        { label: "Bulk Orders", url: "/bulk-orders" },
      ],
    },
  ],
  copyrightText: `© ${new Date().getFullYear()} ${BRAND_DEFAULTS.storeName}. All rights reserved.`,
  showSocialLinks: true,
  ecosystemTitle: "",
  ecosystemIntro: "",
  newsletterTitle: "Stay in the loop",
  newsletterSubtitle: "Weekly Vedic insights, ritual guides, and members-only drops.",
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
  const [operationalPolicies, setOperationalPolicies] =
    useState<OperationalPolicies>(DEFAULT_OPERATIONAL_POLICIES)
  // Region defaults to IN (we ship from India); flips to INTERNATIONAL on
  // mount once we read the vc-region cookie set by middleware.
  const [region, setRegion] = useState<StorefrontRegion>("IN")
  // Cluster sites default to the static seed; admin override (if saved)
  // replaces it on first storefront-config fetch.
  const [clusterSites, setClusterSites] =
    useState<readonly ClusterSite[]>(CLUSTER_SITES)

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) {
      setIsDismissed(true)
    }

    // Read geo-IP region cookie (set by middleware from CF-IPCountry).
    // "international" → USD pricing + $ thresholds in trust ribbon.
    if (typeof window !== "undefined") {
      const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("vc-region="))
      if (cookie?.split("=")[1] === "international") {
        setRegion("INTERNATIONAL")
      }
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
            ecosystemTitle: config.footerConfig.ecosystemTitle ?? DEFAULT_FOOTER.ecosystemTitle,
            ecosystemIntro: config.footerConfig.ecosystemIntro ?? DEFAULT_FOOTER.ecosystemIntro,
            newsletterTitle: config.footerConfig.newsletterTitle || DEFAULT_FOOTER.newsletterTitle,
            newsletterSubtitle: config.footerConfig.newsletterSubtitle || DEFAULT_FOOTER.newsletterSubtitle,
          })
        }

        // Cluster sites — admin override replaces default seed if saved
        if (Array.isArray(config.clusterSites) && config.clusterSites.length > 0) {
          setClusterSites(config.clusterSites)
        }

        // Consultation feature flag
        if (config.consultationConfig) {
          setConsultationsRouteEnabled(config.consultationConfig.consultationsRouteEnabled ?? true)
        }
      } catch {
        // Config unavailable — use defaults silently
      }
    }

    /**
     * Fetch the two operational policy sources in parallel and fold them
     * into a single OperationalPolicies object that the trust ribbon,
     * homepage badge, and legal pages all consume.
     */
    const fetchOperationalPolicies = async () => {
      try {
        const headers = { "x-publishable-api-key": PUB_KEY }
        const [shippingRes, returnRes] = await Promise.all([
          fetch(`${BACKEND_URL}/store/shipping-config`, { headers }),
          fetch(`${BACKEND_URL}/store/return-policy`, { headers }),
        ])

        const next = { ...DEFAULT_OPERATIONAL_POLICIES }

        if (shippingRes.ok) {
          const { config } = await shippingRes.json()
          if (config?.freeShipping) {
            next.freeShippingThresholdInr = config.freeShipping.thresholdINR ?? next.freeShippingThresholdInr
            next.freeShippingThresholdUsd = config.freeShipping.thresholdUSD ?? next.freeShippingThresholdUsd
          }
          if (config?.cod) {
            next.codEnabled = config.cod.enabled ?? next.codEnabled
            next.codFee = config.cod.fee ?? next.codFee
            next.codMinOrderInr = config.cod.minOrder ?? next.codMinOrderInr
            next.codMaxOrderInr = config.cod.maxOrder ?? next.codMaxOrderInr
          }
          // Derive default delivery display from the standard delivery
          // estimate (the "Rest of India" / "Standard" row admin saved).
          // Falls back to whatever's present if no row matches "standard".
          const ests = config?.deliveryEstimates as
            | Array<{ region?: string; minDays?: number; maxDays?: number }>
            | undefined
          if (Array.isArray(ests) && ests.length) {
            const standard =
              ests.find((e) => /standard|rest of india/i.test(e.region || "")) ||
              ests[0]
            if (standard && typeof standard.minDays === "number" && typeof standard.maxDays === "number") {
              next.defaultDeliveryDisplay = `${standard.minDays}-${standard.maxDays} business days`
            }
          }
        }

        if (returnRes.ok) {
          const { returnPolicy } = await returnRes.json()
          if (returnPolicy) {
            next.returnWindowDays = returnPolicy.windowDays ?? next.returnWindowDays
            next.inspectionDays = returnPolicy.inspectionDays ?? next.inspectionDays
            next.refundDays = returnPolicy.refundDays ?? next.refundDays
            next.unboxingVideoRequired = returnPolicy.unboxingVideoRequired ?? next.unboxingVideoRequired
          }
        }

        setOperationalPolicies(next)
      } catch {
        // Defaults already applied — silent fail keeps the UI stable.
      }
    }

    fetchConfig()
    fetchOperationalPolicies()
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
        operationalPolicies,
        region,
        clusterSites,
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

/**
 * Single source of truth for post-purchase operational rules. Consumed by
 * the footer trust ribbon, homepage trust badge, refund-policy legal page,
 * and shipping-policy SEO meta. Backed by /store/shipping-config and
 * /store/return-policy — admin edits propagate live (15s revalidation).
 */
export function useOperationalPolicies(): OperationalPolicies {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useOperationalPolicies must be used within AnnouncementProvider")
  return ctx.operationalPolicies
}

/**
 * Geo-detected region. "INTERNATIONAL" visitors should see USD thresholds
 * (e.g. "$50 free shipping") instead of INR. Set by middleware via the
 * Cloudflare CF-IPCountry header → vc-region cookie.
 */
export function useStorefrontRegion(): StorefrontRegion {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useStorefrontRegion must be used within AnnouncementProvider")
  return ctx.region
}

/**
 * Brand cluster sites — admin override (if saved) or the default seed.
 * Consumed by the footer ecosystem cards. Server-side consumers (sitemap,
 * DNS prefetch, JSON-LD) use `lib/cluster-sites-ssr.ts` instead.
 */
export function useClusterSites(): readonly ClusterSite[] {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useClusterSites must be used within AnnouncementProvider")
  return ctx.clusterSites
}
