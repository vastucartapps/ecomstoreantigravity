import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/brand-defaults"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// Private + transactional + auth surfaces — bot crawl wastes the crawl budget
// and risks leaking PII or token-bearing URLs into the search index. Layouts
// also send noindex meta but Disallow here keeps the URLs out of "site:"
// listings entirely.
const DISALLOW_DEFAULT = [
  "/admin/",
  "/admin-login",
  "/account/",
  "/cart/",
  "/cart/recover/",
  "/checkout/",
  "/order-confirmation/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/",
  "/api/",
]

/**
 * The sitemap(s) a subdomain declares MUST be its own only. Declaring the
 * parent brand's or sibling cluster sitemaps (or a parked domain like
 * vastucart.com) wastes crawl budget and poisons crawler trust — each
 * subdomain has its own GSC property and cross-references aren't authoritative.
 *
 * We force the canonical own-origin sitemap and accept only same-origin
 * admin-added sitemaps (e.g. a future /sitemap-image.xml), filtering out any
 * cross-domain entry regardless of what stale admin metadata may contain.
 */
function ownSitemaps(adminSitemaps: string[] = []): string[] {
  const site = getSiteUrl()
  let origin = ""
  try {
    origin = new URL(site).origin
  } catch {
    origin = ""
  }
  const own = `${site}/sitemap.xml`
  const sameOrigin = adminSitemaps.filter((u) => {
    try {
      return origin !== "" && new URL(u).origin === origin
    } catch {
      return false
    }
  })
  return Array.from(new Set([own, ...sameOrigin]))
}

function defaultRules(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: DISALLOW_DEFAULT }],
    sitemap: ownSitemaps(),
  }
}

/**
 * Parse a raw robots.txt string into Next.js MetadataRoute.Robots format.
 * Handles: User-agent, Allow, Disallow, Sitemap directives.
 *
 * The Sitemap directive(s) in the admin string are NOT trusted verbatim — they
 * are filtered to this subdomain's own origin by ownSitemaps(), so a stale
 * admin value (e.g. a parked vastucart.com sitemap) or cross-cluster entries
 * can never poison the served robots.txt.
 */
function parseRobotsTxt(raw: string): MetadataRoute.Robots {
  const rules: Array<{
    userAgent: string
    allow: string[]
    disallow: string[]
  }> = []
  let current: { userAgent: string; allow: string[]; disallow: string[] } | null = null
  const adminSitemaps: string[] = []

  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue

    if (t.toLowerCase().startsWith("user-agent:")) {
      if (current) rules.push(current)
      current = {
        userAgent: t.slice(11).trim(),
        allow: [],
        disallow: [],
      }
    } else if (t.toLowerCase().startsWith("allow:") && current) {
      const path = t.slice(6).trim()
      if (path) current.allow.push(path)
    } else if (t.toLowerCase().startsWith("disallow:") && current) {
      const path = t.slice(9).trim()
      if (path) current.disallow.push(path)
    } else if (t.toLowerCase().startsWith("sitemap:")) {
      const url = t.slice(8).trim()
      if (url) adminSitemaps.push(url)
    }
  }

  if (current) rules.push(current)

  if (rules.length === 0) return defaultRules()

  // Own-origin sitemap(s) only — never trust the admin string's Sitemap line
  // verbatim (it may carry a stale parked-domain or cross-cluster entry).
  const sitemap = ownSitemaps(adminSitemaps)

  return {
    rules: rules.map((r) => ({
      userAgent: r.userAgent,
      ...(r.allow.length > 0 && {
        allow: r.allow.length === 1 ? r.allow[0] : r.allow,
      }),
      ...(r.disallow.length > 0 && {
        disallow: r.disallow.length === 1 ? r.disallow[0] : r.disallow,
      }),
    })),
    sitemap,
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/integrations-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      next: { revalidate: 3600 }, // Re-fetch at most every hour
    })
    if (res.ok) {
      const data = await res.json()
      if (data.seoDefaults?.robotsTxt) {
        return parseRobotsTxt(data.seoDefaults.robotsTxt)
      }
    }
  } catch {
    // Fall through to defaults
  }

  return defaultRules()
}
