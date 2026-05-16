import type { MetadataRoute } from "next"
import { fetchClusterSites, clusterSitemapsFrom } from "@/lib/cluster-sites-ssr"
import { BRAND_URL } from "@/lib/cluster-sites"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function defaultRules(): Promise<MetadataRoute.Robots> {
  // Cluster sitemaps fetched dynamically — admin can add a 10th sister
  // site and robots.txt will list it on the next revalidate (5 min).
  const sites = await fetchClusterSites()
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private + transactional + auth surfaces — bot crawl wastes the
        // crawl budget and risks leaking PII or token-bearing URLs into
        // the search index. Layouts also send noindex meta but Disallow
        // here keeps the URLs out of "site:" listings entirely.
        disallow: [
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
        ],
      },
    ],
    sitemap: clusterSitemapsFrom(sites, BRAND_URL),
  }
}

/**
 * Parse a raw robots.txt string into Next.js MetadataRoute.Robots format.
 * Handles: User-agent, Allow, Disallow, Sitemap directives.
 *
 * Async because cluster sitemaps are now resolved from admin (the
 * /store/storefront-config response) — admin can edit the cluster
 * without a deploy.
 */
async function parseRobotsTxt(raw: string): Promise<MetadataRoute.Robots> {
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

  // Always merge cluster sitemaps with any admin-defined ones so the whole
  // ecosystem is discoverable regardless of admin config. Dedupe on URL.
  const sites = await fetchClusterSites()
  const sitemap = Array.from(
    new Set([...adminSitemaps, ...clusterSitemapsFrom(sites, BRAND_URL)])
  )

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
        return await parseRobotsTxt(data.seoDefaults.robotsTxt)
      }
    }
  } catch {
    // Fall through to defaults
  }

  return defaultRules()
}
