/**
 * Backend SSoT helper — reads canonical brand info from store metadata.
 *
 * Every admin-editable branding value (storeName, tagline, contactEmail,
 * contactPhone, address, socialLinks, logoUrl, support emails, founder
 * name, team signature) is saved to `store.metadata.storefront_config` by
 * the admin storefront UI. Backend code (transactional emails, push, SMS,
 * WhatsApp, GMC/Meta feeds, Listmonk lists, QA/support replies) reads
 * from here so admin edits propagate everywhere.
 *
 * Falls back through:
 *   1. store.metadata.storefront_config.branding (admin canonical)
 *   2. STORE_NAME / SUPPORT_EMAIL / etc. env vars (legacy ops fallback)
 *   3. Hardcoded "VastuCart" / "support@vastucart.in" (last resort)
 *
 * Use from any subscriber, route, workflow, or service that has access to
 * the VastuCart DI container or `req.scope`:
 *
 *   const brand = await fetchBrandFromStore(container)
 *   subject: `Your ${brand.storeName} order #${orderId}…`
 */

import { Modules } from "@medusajs/framework/utils"

export interface SupportEmails {
  wholesale: string
  returns: string
  grievance: string
  privacy: string
  legal: string
  orders: string
}

export interface BackendBrand {
  storeName: string
  legalName: string
  tagline: string
  contactEmail: string
  contactPhone: string
  storeUrl: string
  logoUrl: string
  /** Founder display name — used in admin-issued QA answers when the
   *  actor user has no first/last name on file, in grievance officer
   *  records, and About-page schema.org Person entries. */
  founderName: string
  /** Signature line used by admin replies in QA + support tickets when
   *  the actor's own name isn't available. */
  teamSignature: string
  /** Per-purpose support email addresses for transactional copy. */
  supportEmails: SupportEmails
}

/** Hardcoded last-resort fallback. Mirrors frontend `lib/brand-defaults.ts`. */
const HARDCODED_FALLBACK: BackendBrand = {
  storeName: "VastuCart",
  legalName: "Prashant Kumar",
  tagline: "Sacred Essentials for Your Spiritual Journey",
  contactEmail: "support@vastucart.in",
  contactPhone: "+91 94611 94356",
  storeUrl: "https://store.vastucart.in",
  logoUrl: "/VastuCartLogo.png",
  founderName: "Prashant Kumar",
  teamSignature: "VastuCart Team",
  supportEmails: {
    wholesale: "wholesale@vastucart.in",
    returns: "returns@vastucart.in",
    grievance: "grievance@vastucart.in",
    privacy: "privacy@vastucart.in",
    legal: "legal@vastucart.in",
    orders: "orders@vastucart.in",
  },
}

function envOr<T extends string>(envKey: string, fallback: T): T | string {
  return process.env[envKey] || fallback
}

/**
 * Read the canonical brand record from store metadata. Resolves the Store
 * service via the VastuCart container and folds the admin-saved branding +
 * env-var overrides + hardcoded fallback into a single immutable object.
 *
 * Safe to call from subscribers, route handlers, workflows, and scheduled
 * jobs — anything with access to the DI container.
 */
export async function fetchBrandFromStore(
  container: { resolve: (key: any) => any }
): Promise<BackendBrand> {
  const out: BackendBrand = {
    storeName: envOr("STORE_NAME", HARDCODED_FALLBACK.storeName),
    legalName: envOr("STORE_NAME", HARDCODED_FALLBACK.legalName),
    tagline: HARDCODED_FALLBACK.tagline,
    contactEmail: envOr("SUPPORT_EMAIL", HARDCODED_FALLBACK.contactEmail),
    contactPhone: HARDCODED_FALLBACK.contactPhone,
    storeUrl: envOr("STORE_URL", HARDCODED_FALLBACK.storeUrl),
    logoUrl: HARDCODED_FALLBACK.logoUrl,
    founderName: HARDCODED_FALLBACK.founderName,
    teamSignature: HARDCODED_FALLBACK.teamSignature,
    supportEmails: { ...HARDCODED_FALLBACK.supportEmails },
  }

  try {
    const storeService = container.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const sfConfig = (store?.metadata as any)?.storefront_config
    const branding = sfConfig?.branding
    if (branding) {
      if (branding.storeName) {
        out.storeName = branding.storeName
        // Only auto-set legalName from storeName when admin hasn't given
        // an explicit legalName — sole-proprietor legal name (e.g.
        // "Prashant Kumar") differs from the trading brand.
        if (!branding.legalName) out.legalName = branding.storeName
      }
      if (branding.legalName) out.legalName = branding.legalName
      if (branding.tagline) out.tagline = branding.tagline
      if (branding.contactEmail) out.contactEmail = branding.contactEmail
      if (branding.contactPhone) out.contactPhone = branding.contactPhone
      if (branding.logoUrl) out.logoUrl = branding.logoUrl
      if (branding.founderName) out.founderName = branding.founderName
      if (branding.teamSignature) out.teamSignature = branding.teamSignature
      const se = branding.supportEmails || sfConfig.supportEmails
      if (se && typeof se === "object") {
        out.supportEmails = {
          wholesale: se.wholesale || out.supportEmails.wholesale,
          returns: se.returns || out.supportEmails.returns,
          grievance: se.grievance || out.supportEmails.grievance,
          privacy: se.privacy || out.supportEmails.privacy,
          legal: se.legal || out.supportEmails.legal,
          orders: se.orders || out.supportEmails.orders,
        }
      }
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
    storeName: envOr("STORE_NAME", HARDCODED_FALLBACK.storeName),
    legalName: envOr("STORE_NAME", HARDCODED_FALLBACK.legalName),
    tagline: HARDCODED_FALLBACK.tagline,
    contactEmail: envOr("SUPPORT_EMAIL", HARDCODED_FALLBACK.contactEmail),
    contactPhone: HARDCODED_FALLBACK.contactPhone,
    storeUrl: envOr("STORE_URL", HARDCODED_FALLBACK.storeUrl),
    logoUrl: HARDCODED_FALLBACK.logoUrl,
    founderName: HARDCODED_FALLBACK.founderName,
    teamSignature: HARDCODED_FALLBACK.teamSignature,
    supportEmails: { ...HARDCODED_FALLBACK.supportEmails },
  }
}
