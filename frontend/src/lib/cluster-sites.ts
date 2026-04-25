/**
 * Default cluster sites — the 9 sister sites that share brand/SEO authority.
 * These are SEEDS only. Admin can override the entire list via Storefront
 * → Cluster Sites tab; saved overrides flow through `cluster-sites-ssr.ts`
 * to all four consumers (SEO schema, robots, DNS prefetch, footer cards).
 *
 * Consumers (all read via the SSR helper or client hook, not by importing
 * these constants directly anymore):
 *  - lib/schema/site-schema.ts        → Organization JSON-LD `sameAs`
 *  - app/robots.ts                    → cross-domain Sitemap discovery
 *  - app/(storefront)/layout.tsx      → <link rel="dns-prefetch" />
 *  - components/shell/StorefrontShell.tsx → footer Ecosystem cards
 *
 * Source-of-truth precedence:
 *  1. store.metadata.storefront_config.clusterSites (admin override)
 *  2. CLUSTER_SITES below (default seed)
 */

export interface ClusterSite {
  /** Subdomain key — used as React `key` and as the relative path slug */
  slug: string
  /** Human-readable name shown in footer ecosystem cards */
  name: string
  /** Absolute URL — must be https:// (used in JSON-LD, DNS prefetch, robots) */
  url: string
  /** Short description shown under the card name */
  description: string
  /** Background colour (hex) for the card's icon tile */
  iconBg: string
  /** Optional foreground colour for icon glyph (defaults to white) */
  iconFg?: string
  /** Single-character glyph rendered inside the icon tile */
  glyph: string
  /** Optional badge label (e.g., "PREMIUM") shown next to the name */
  badge?: string
  /** True for the current site — card opens "/" instead of opening a new tab */
  isCurrent?: boolean
}

/** Parent brand. Listed as canonical brand URL but not as a card. */
export const BRAND_URL = "https://vastucart.in"

export const CLUSTER_SITES: readonly ClusterSite[] = [
  {
    slug: "kundali",
    name: "Kundali Decoded",
    url: "https://kundali.vastucart.in",
    description: "Enterprise-grade birth-chart platform with 74 Vedic modules.",
    iconBg: "#c2410c",
    glyph: "✦",
    badge: "PREMIUM",
  },
  {
    slug: "store",
    name: "VastuCart Store",
    url: "https://store.vastucart.in",
    description: "Handcrafted yantras, rudraksha, idols, and Vastu décor.",
    iconBg: "#0d7a89",
    glyph: "◈",
    isCurrent: true,
  },
  {
    slug: "blog",
    name: "VastuCart Blog",
    url: "https://blog.vastucart.in",
    description: "Long-form Jyotish research by practising Vedic astrologers.",
    iconBg: "#d4a13c",
    iconFg: "#2a1f08",
    glyph: "❡",
  },
  {
    slug: "panchang",
    name: "Panchang",
    url: "https://panchang.vastucart.in",
    description: "Daily Vedic almanac — tithi, nakshatra, yoga, karana.",
    iconBg: "#eab308",
    iconFg: "#2a1f08",
    glyph: "☀",
  },
  {
    slug: "stotra",
    name: "Stotra",
    url: "https://stotra.vastucart.in",
    description: "Library of Hindu hymns with audio and translations.",
    iconBg: "#e11d48",
    glyph: "ॐ",
  },
  {
    slug: "horoscope",
    name: "Divine Path",
    url: "https://horoscope.vastucart.in",
    description: "Daily, weekly, and yearly horoscope predictions.",
    iconBg: "#8b5cf6",
    glyph: "✧",
  },
  {
    slug: "muhurta",
    name: "Shubh Muhurta",
    url: "https://muhurta.vastucart.in",
    description: "Find auspicious timings for any life event.",
    iconBg: "#10b981",
    glyph: "◷",
  },
  {
    slug: "wedding",
    name: "Wedding Muhurta",
    url: "https://wedding.vastucart.in",
    description: "Dedicated wedding date selection with full Vedic matching.",
    iconBg: "#ec4899",
    glyph: "◆",
  },
  {
    slug: "tarot",
    name: "Tarot by VastuCart",
    url: "https://tarot.vastucart.in",
    description: "Rider-Waite tarot readings with contextual guidance.",
    iconBg: "#d946ef",
    glyph: "☽",
  },
] as const

/** Sibling URLs (excluding the current site) — for sameAs/dns-prefetch lists. */
export const SIBLING_URLS: readonly string[] = CLUSTER_SITES
  .filter((s) => !s.isCurrent)
  .map((s) => s.url)

/** Every cluster URL including parent brand and the current site. */
export const ALL_CLUSTER_URLS: readonly string[] = [
  BRAND_URL,
  ...CLUSTER_SITES.map((s) => s.url),
]

/** Sitemap URLs for every cluster site (parent + 9 sisters). */
export const CLUSTER_SITEMAPS: readonly string[] = [
  `${BRAND_URL}/sitemap.xml`,
  ...CLUSTER_SITES.map((s) => `${s.url}/sitemap.xml`),
]
