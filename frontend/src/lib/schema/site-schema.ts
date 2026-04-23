/**
 * Site-wide schema.org JSON-LD for the root layout.
 * Emits: Organization (with logo, contact, socials) and WebSite (with
 * SearchAction — unlocks Google's sitelinks search box in SERP).
 *
 * Emitted once from the root <body>. The Organization @id is referenced
 * by every product page's Offer.seller, so Google links them as one entity.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const ORG_ID = `${SITE_URL}/#organization`
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

  const sameAs = [
    socials.facebook,
    socials.instagram,
    socials.twitter,
    socials.youtube,
    socials.linkedin,
    socials.pinterest,
  ].filter(Boolean) as string[]

  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": ORG_ID,
    name,
    legalName,
    description,
    url: SITE_URL,
    foundingDate,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: logoUrl,
      contentUrl: logoUrl,
      caption: name,
      inLanguage: "en-IN",
    },
    image: { "@id": `${SITE_URL}/#logo` },
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
