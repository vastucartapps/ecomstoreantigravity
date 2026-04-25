import type { MetadataRoute } from "next"
import { CLUSTER_SITEMAPS as CLUSTER_SITEMAPS_FROM_LIB } from "@/lib/cluster-sites"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Cross-domain sitemap discovery for the VastuCart cluster. Sourced from
 * the single cluster-sites manifest so adding a new sister subdomain
 * propagates here automatically. Materialised as a mutable array because
 * Next.js' MetadataRoute.Robots `sitemap` field expects `string | string[]`.
 */
const CLUSTER_SITEMAPS: string[] = [...CLUSTER_SITEMAPS_FROM_LIB]

const DEFAULT_RULES: MetadataRoute.Robots = {
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cart/", "/checkout/", "/api/"],
    },
  ],
  sitemap: CLUSTER_SITEMAPS,
}

/**
 * Parse a raw robots.txt string into Next.js MetadataRoute.Robots format.
 * Handles: User-agent, Allow, Disallow, Sitemap directives.
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

  if (rules.length === 0) return DEFAULT_RULES

  // Always merge cluster sitemaps with any admin-defined ones so the whole
  // ecosystem is discoverable regardless of admin config. Dedupe on URL.
  const sitemap = Array.from(new Set([...adminSitemaps, ...CLUSTER_SITEMAPS]))

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

  return DEFAULT_RULES
}
