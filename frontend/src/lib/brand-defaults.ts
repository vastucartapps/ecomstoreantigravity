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
  /** Legal entity name for invoices + legal pages. Per the user's
   *  reconciliation decision, the sole proprietor is "Prashant Kumar".
   *  The About page used to say "Prashant Vaishnav" — that has been
   *  retired everywhere in favour of the legal name. */
  legalName: "Prashant Kumar",
  /** Founder display name used on the About page + structured-data
   *  Person entries. Single field so future edits in one place. */
  founderName: "Prashant Kumar",
  founderRole: "Founder & Vastu Practitioner",
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
  /** Site URL used in invoice headers / footer copyright when no admin
   *  override is present. Routes that have access to env vars should
   *  prefer NEXT_PUBLIC_SITE_URL. */
  siteUrl: "https://store.vastucart.in",
  foundingDate: "2024-01-01",
  /**
   * Per-purpose support email addresses. Admin overrides come from
   * store.metadata.storefront_config.supportEmails — if a key is missing
   * we fall back to the primary contactEmail so no policy page renders a
   * dead address. Every legal/contact surface reads from here so a single
   * edit propagates everywhere.
   */
  supportEmails: {
    wholesale: "wholesale@vastucart.com",
    returns: "returns@vastucart.com",
    grievance: "grievance@vastucart.com",
    privacy: "privacy@vastucart.com",
    legal: "legal@vastucart.com",
    orders: "orders@vastucart.in",
  },
  /** Display name used in admin-issued reviews replies, Q&A answers, and
   *  support-ticket reply signatures. Editable via admin → Storefront. */
  teamSignature: "VastuCart Team",
  /** Seller's registered state for GST intra-vs-inter-state determination.
   *  Matches the operational address (Varanasi → Uttar Pradesh). */
  sellerState: "Uttar Pradesh",
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
export type SupportEmailKey = keyof typeof BRAND_DEFAULTS.supportEmails

/** Site URL resolver — prefers env var, falls back to seed. Centralised so
 *  no code path hardcodes "https://store.vastucart.in" or "vastucart.com". */
export function getSiteUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  return BRAND_DEFAULTS.siteUrl
}

/** Hostname-only display string for invoice headers ("store.vastucart.in"). */
export function getSiteHost(): string {
  return getSiteUrl().replace(/^https?:\/\//, "")
}
