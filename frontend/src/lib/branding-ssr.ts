/**
 * SSR helper for `generateMetadata` in layout files. Fetches the admin's
 * branding + operational policies once per request (Next caches via the
 * fetch revalidate window) and returns a flat object suitable for
 * interpolating into <title>, <description>, OpenGraph, and Twitter card
 * fields.
 *
 * Use in any `app/.../layout.tsx`:
 *
 * ```ts
 * import { fetchBrandingForMetadata } from "@/lib/branding-ssr"
 * export async function generateMetadata(): Promise<Metadata> {
 *   const b = await fetchBrandingForMetadata()
 *   return { title: `Refund & Returns | ${b.storeName}`, ... }
 * }
 * ```
 */

import { BRAND_DEFAULTS } from "@/lib/brand-defaults"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"

export interface MetadataBranding {
  storeName: string
  tagline: string
  logoUrl: string
  faviconUrl: string
  contactEmail: string
  contactPhone: string
  siteUrl: string
  /** From shipping_config.freeShipping.thresholdINR — used in policy SEO meta. */
  freeShippingInr: number
  /** From shipping_config.freeShipping.thresholdUSD. */
  freeShippingUsd: number
  /** Base domestic (INR) shipping rate below the free threshold. */
  shippingRateInr: number
  /** Base international (USD) shipping rate below the free threshold. */
  shippingRateUsd: number
  /** From return_policy.windowDays — used in refund-policy SEO meta. */
  returnWindowDays: number
  /** Admin-pasted Google Search Console site-verification token (or ""). */
  googleSiteVerification: string
}

/**
 * Fetch the canonical storefront branding + operational fields used by
 * `generateMetadata` in layout files. Returns BRAND_DEFAULTS-backed values
 * if the backend is unreachable so SEO meta never breaks the build.
 *
 * Cached for 5 minutes via Next's fetch revalidate so admin edits show up
 * to crawlers within ~5 min of save without per-request load.
 */
export async function fetchBrandingForMetadata(): Promise<MetadataBranding> {
  const fallback: MetadataBranding = {
    storeName: BRAND_DEFAULTS.storeName,
    tagline: BRAND_DEFAULTS.tagline,
    logoUrl: BRAND_DEFAULTS.logoUrl,
    faviconUrl: BRAND_DEFAULTS.faviconUrl,
    contactEmail: BRAND_DEFAULTS.contactEmail,
    contactPhone: BRAND_DEFAULTS.contactPhone,
    siteUrl: SITE_URL,
    freeShippingInr: 999,
    freeShippingUsd: 50,
    shippingRateInr: 49,
    shippingRateUsd: 15,
    returnWindowDays: 7,
    googleSiteVerification: "",
  }

  try {
    const headers = { "x-publishable-api-key": PUB_KEY }
    const next = { revalidate: 300 }
    const [storefrontRes, shippingRes, returnRes, integrationsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/store/storefront-config`, { headers, next }),
      fetch(`${BACKEND_URL}/store/shipping-config`, { headers, next }),
      fetch(`${BACKEND_URL}/store/return-policy`, { headers, next }),
      fetch(`${BACKEND_URL}/store/integrations-config`, { headers, next }),
    ])

    const out = { ...fallback }

    if (storefrontRes.ok) {
      const data = await storefrontRes.json()
      const b = data.config?.branding
      if (b?.storeName) out.storeName = b.storeName
      if (b?.tagline) out.tagline = b.tagline
      if (b?.logoUrl) out.logoUrl = b.logoUrl
      if (b?.faviconUrl) out.faviconUrl = b.faviconUrl
      if (b?.contactEmail) out.contactEmail = b.contactEmail
      if (b?.contactPhone) out.contactPhone = b.contactPhone
    }

    if (shippingRes.ok) {
      const { config } = await shippingRes.json()
      if (config?.freeShipping?.thresholdINR) {
        out.freeShippingInr = config.freeShipping.thresholdINR
      }
      if (config?.freeShipping?.thresholdUSD) {
        out.freeShippingUsd = config.freeShipping.thresholdUSD
      }
      // Base shipping rate per region (below the free-shipping threshold).
      const zones: Array<{ rate?: number; currency?: string; isEnabled?: boolean }> =
        config?.zones || []
      const inrZone = zones.find((z) => z.currency === "INR")
      const usdZone = zones.find((z) => z.currency === "USD")
      if (typeof inrZone?.rate === "number") out.shippingRateInr = inrZone.rate
      if (typeof usdZone?.rate === "number") out.shippingRateUsd = usdZone.rate
    }

    if (returnRes.ok) {
      const { returnPolicy } = await returnRes.json()
      if (returnPolicy?.windowDays) out.returnWindowDays = returnPolicy.windowDays
    }

    if (integrationsRes.ok) {
      const data = await integrationsRes.json()
      if (data?.gsc?.verificationToken) {
        out.googleSiteVerification = data.gsc.verificationToken
      }
    }

    return out
  } catch {
    return fallback
  }
}
