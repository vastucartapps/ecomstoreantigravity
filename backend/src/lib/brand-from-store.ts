/**
 * Backend SSoT helper — reads canonical brand info from store metadata.
 *
 * Every admin-editable branding value (storeName, tagline, contactEmail,
 * contactPhone, address, socialLinks, logoUrl) is saved to
 * `store.metadata.storefront_config.branding` by the admin storefront UI.
 * Backend code (transactional emails, push, SMS, WhatsApp, GMC/Meta feeds,
 * Listmonk lists) reads from here so admin edits propagate everywhere.
 *
 * Falls back through:
 *   1. store.metadata.storefront_config.branding (admin canonical)
 *   2. STORE_NAME / SUPPORT_EMAIL / etc. env vars (legacy ops fallback)
 *   3. Hardcoded "VastuCart" / "support@vastucart.com" (last resort)
 *
 * Use from any subscriber, route, workflow, or service that has access to
 * the Medusa DI container or `req.scope`:
 *
 *   const brand = await fetchBrandFromStore(container)
 *   subject: `Your ${brand.storeName} order #${orderId}…`
 */

import { Modules } from "@medusajs/framework/utils"

export interface BackendBrand {
  storeName: string
  legalName: string
  tagline: string
  contactEmail: string
  contactPhone: string
  storeUrl: string
  logoUrl: string
}

/** Hardcoded last-resort fallback. Mirrors frontend `lib/brand-defaults.ts`. */
const HARDCODED_FALLBACK: BackendBrand = {
  storeName: "VastuCart",
  legalName: "VastuCart",
  tagline: "Sacred Essentials for Your Spiritual Journey",
  contactEmail: "support@vastucart.com",
  contactPhone: "+91 94611 94356",
  storeUrl: "https://store.vastucart.in",
  logoUrl: "/VastuCartLogo.png",
}

/**
 * Read the canonical brand record from store metadata. Resolves the Store
 * service via the Medusa container and folds the admin-saved branding +
 * env-var overrides + hardcoded fallback into a single immutable object.
 *
 * Safe to call from subscribers, route handlers, workflows, and scheduled
 * jobs — anything with access to the DI container.
 */
export async function fetchBrandFromStore(
  container: { resolve: (key: any) => any }
): Promise<BackendBrand> {
  const out: BackendBrand = {
    storeName: process.env.STORE_NAME || HARDCODED_FALLBACK.storeName,
    legalName: process.env.STORE_NAME || HARDCODED_FALLBACK.legalName,
    tagline: HARDCODED_FALLBACK.tagline,
    contactEmail: process.env.SUPPORT_EMAIL || HARDCODED_FALLBACK.contactEmail,
    contactPhone: HARDCODED_FALLBACK.contactPhone,
    storeUrl: process.env.STORE_URL || HARDCODED_FALLBACK.storeUrl,
    logoUrl: HARDCODED_FALLBACK.logoUrl,
  }

  try {
    const storeService = container.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const branding = (store?.metadata as any)?.storefront_config?.branding
    if (branding) {
      if (branding.storeName) out.storeName = branding.storeName
      if (branding.storeName) out.legalName = branding.storeName
      if (branding.tagline) out.tagline = branding.tagline
      if (branding.contactEmail) out.contactEmail = branding.contactEmail
      if (branding.contactPhone) out.contactPhone = branding.contactPhone
      if (branding.logoUrl) out.logoUrl = branding.logoUrl
    }
  } catch {
    // Resolver unavailable or DB error — env + hardcoded fallback is fine
  }

  return out
}

/**
 * Synchronous fallback for code paths that don't have container access
 * (e.g. module-level constants in transformers). Returns env + hardcoded
 * values only — does NOT read store metadata. Prefer `fetchBrandFromStore`
 * wherever container is available.
 */
export function brandFallback(): BackendBrand {
  return {
    storeName: process.env.STORE_NAME || HARDCODED_FALLBACK.storeName,
    legalName: process.env.STORE_NAME || HARDCODED_FALLBACK.legalName,
    tagline: HARDCODED_FALLBACK.tagline,
    contactEmail: process.env.SUPPORT_EMAIL || HARDCODED_FALLBACK.contactEmail,
    contactPhone: HARDCODED_FALLBACK.contactPhone,
    storeUrl: process.env.STORE_URL || HARDCODED_FALLBACK.storeUrl,
    logoUrl: HARDCODED_FALLBACK.logoUrl,
  }
}
