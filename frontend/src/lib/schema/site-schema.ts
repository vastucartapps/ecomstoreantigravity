/**
 * Site-wide schema.org JSON-LD for the root layout.
 * Emits: Organization (with logo, contact, socials) and WebSite (with
 * SearchAction — unlocks Google's sitelinks search box in SERP).
 *
 * Emitted once from the root <body>. The Organization @id is referenced
 * by every product page's Offer.seller, so Google links them as one entity.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
/**
 * Canonical brand URL. The Organization entity represents the brand itself
 * (VastuCart), which lives at vastucart.in. This store (store.vastucart.in)
 * is one of several properties of that brand — emitted as a `sameAs` so
 * Google links both URLs to a single knowledge-graph entity.
 */
const BRAND_URL = process.env.NEXT_PUBLIC_BRAND_URL || "https://vastucart.in"
const ORG_ID = `${BRAND_URL}/#organization`
const WEBSITE_ID = `${SITE_URL}/#website`

/** Ensure a URL is absolute — schema.org parsers reject relative paths for logos. */
function toAbsolute(url: string | undefined | null): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

export interface SiteSocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  youtube?: string
  linkedin?: string
  pinterest?: string
  threads?: string
  etsy?: string
  amazon?: string
}

/**
 * Sister sites in the VastuCart cluster — each is a separate WebSite owned by
 * the same Organization. Listing them in the brand's `sameAs` tells Google
 * these subdomains all represent the same entity, which strengthens the whole
 * cluster's authority (the "ecosystem juice" effect).
 *
 * Source of truth: /Presence links.txt at repo root.
 */
const SISTER_SITES: readonly string[] = [
  "https://kundali.vastucart.in",
  "https://blog.vastucart.in",
  "https://panchang.vastucart.in",
  "https://stotra.vastucart.in",
  "https://horoscope.vastucart.in",
  "https://muhurta.vastucart.in",
  "https://wedding.vastucart.in",
  "https://tarot.vastucart.in",
]

/**
 * Brand-level social and marketplace presence. These are properties of the
 * VastuCart brand itself — independent of any per-store admin config. They
 * always belong in the Organization `sameAs` array regardless of what the
 * admin has entered. Marketplaces (Etsy, Amazon) appear here for SEO/
 * knowledge-graph signal only — they are intentionally NOT surfaced on
 * product pages, only as minimal footer icons.
 */
const BRAND_PRESENCE: Required<Pick<SiteSocialLinks,
  "facebook" | "instagram" | "twitter" | "pinterest" | "threads" | "etsy" | "amazon"
>> = {
  facebook: "https://www.facebook.com/vastucartindia",
  instagram: "https://www.instagram.com/vastucart/",
  twitter: "https://x.com/vastucart",
  pinterest: "https://in.pinterest.com/vastucart/",
  threads: "https://www.threads.com/@vastucart",
  etsy: "https://vastucart.etsy.com",
  amazon: "https://www.amazon.in/s?k=vastucart",
}

export interface SiteContactInfo {
  phone?: string
  email?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string // ISO 3166-1 alpha-2
  streetAddress?: string
}

export interface SiteSchemaInput {
  name?: string
  legalName?: string
  description?: string
  logoUrl?: string
  socials?: SiteSocialLinks
  contact?: SiteContactInfo
  foundingDate?: string
}

const DEFAULTS: Required<Omit<SiteSchemaInput, "socials" | "contact">> = {
  name: "VastuCart",
  legalName: "VastuCart",
  description:
    "Authentic spiritual products, crystals, yantras, and Vastu Shastra tools — delivered across India.",
  logoUrl: `${SITE_URL}/logo.png`,
  foundingDate: "2024-01-01",
}

export function buildSiteGraph(input: SiteSchemaInput = {}) {
  const name = input.name || DEFAULTS.name
  const legalName = input.legalName || DEFAULTS.legalName
  const description = input.description || DEFAULTS.description
  const logoUrl = toAbsolute(input.logoUrl) || DEFAULTS.logoUrl
  const foundingDate = input.foundingDate || DEFAULTS.foundingDate
  const socials = input.socials || {}
  const contact = input.contact || {}

  // Build sameAs list: this store's URL + every sister subdomain in the
  // cluster + all brand socials/marketplaces + any admin-entered overrides.
  // Hardcoded brand presence wins over admin entries that are missing; admin
  // entries override defaults when set. Deduplicated at the end.
  const sameAsRaw = [
    BRAND_URL !== SITE_URL ? SITE_URL : null,
    ...SISTER_SITES,
    socials.facebook ?? BRAND_PRESENCE.facebook,
    socials.instagram ?? BRAND_PRESENCE.instagram,
    socials.twitter ?? BRAND_PRESENCE.twitter,
    socials.pinterest ?? BRAND_PRESENCE.pinterest,
    socials.threads ?? BRAND_PRESENCE.threads,
    socials.etsy ?? BRAND_PRESENCE.etsy,
    socials.amazon ?? BRAND_PRESENCE.amazon,
    socials.youtube,
    socials.linkedin,
  ].filter(Boolean) as string[]
  const sameAs = Array.from(new Set(sameAsRaw))

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": ORG_ID,
    name,
    legalName,
    description,
    url: BRAND_URL,
    foundingDate,
    logo: {
      "@type": "ImageObject",
      "@id": `${BRAND_URL}/#logo`,
      url: logoUrl,
      contentUrl: logoUrl,
      caption: name,
      inLanguage: "en-IN",
    },
    image: { "@id": `${BRAND_URL}/#logo` },
  }

  if (sameAs.length) organization.sameAs = sameAs

  const contactPoint: Record<string, unknown>[] = []
  if (contact.phone || contact.email) {
    contactPoint.push({
      "@type": "ContactPoint",
      contactType: "customer support",
      ...(contact.phone ? { telephone: contact.phone } : {}),
      ...(contact.email ? { email: contact.email } : {}),
      areaServed: ["IN", "Worldwide"],
      availableLanguage: ["en", "hi"],
    })
  }
  if (contactPoint.length) organization.contactPoint = contactPoint

  if (
    contact.streetAddress ||
    contact.addressLocality ||
    contact.addressRegion ||
    contact.postalCode ||
    contact.addressCountry
  ) {
    organization.address = {
      "@type": "PostalAddress",
      ...(contact.streetAddress ? { streetAddress: contact.streetAddress } : {}),
      ...(contact.addressLocality ? { addressLocality: contact.addressLocality } : {}),
      ...(contact.addressRegion ? { addressRegion: contact.addressRegion } : {}),
      ...(contact.postalCode ? { postalCode: contact.postalCode } : {}),
      addressCountry: contact.addressCountry || "IN",
    }
  }

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name,
    description,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  }
}
