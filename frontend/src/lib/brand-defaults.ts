/**
 * Canonical brand seed values — the single source of truth for default
 * VastuCart brand information. Imported by every layer that needs a
 * fallback when admin hasn't saved a value yet.
 *
 * Consumers (all import from here, no local duplicates):
 *  - providers/announcement-provider.tsx → DEFAULT_BRANDING runtime fallback
 *  - hooks/useAdminStorefront.ts        → admin form initial values
 *  - lib/schema/site-schema.ts          → JSON-LD `sameAs` fallbacks
 *  - app/layout.tsx                     → static metadata fallbacks (until generateMetadata)
 *
 * **This file is the seed.** Admin-saved values in store.metadata always
 * win at runtime — these defaults only apply if admin has not entered a
 * value. To change the value an admin sees in production, edit it in
 * admin, not here.
 */

export const BRAND_DEFAULTS = {
  storeName: "VastuCart",
  legalName: "VastuCart",
  tagline: "Sacred Essentials for Your Spiritual Journey",
  description:
    "Authentic spiritual products, crystals, yantras, and Vastu Shastra tools — delivered across India.",
  logoUrl: "/VastuCartLogo.png",
  faviconUrl: "/favicon.png",
  contactEmail: "support@vastucart.com",
  contactPhone: "+91 94611 94356",
  whatsapp: "+91 94611 94356",
  streetAddress: "42 Temple Lane",
  addressLocality: "Varanasi",
  addressRegion: "Uttar Pradesh",
  postalCode: "221001",
  /** ISO 3166-1 alpha-2 */
  addressCountry: "IN",
  foundingDate: "2024-01-01",
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
} as const

export type BrandDefaults = typeof BRAND_DEFAULTS
export type BrandSocialLinks = typeof BRAND_DEFAULTS.socialLinks
