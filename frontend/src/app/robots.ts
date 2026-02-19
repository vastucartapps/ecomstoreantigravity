import type { MetadataRoute } from "next"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const DEFAULT_RULES: MetadataRoute.Robots = {
  rules: [
    {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/cart/", "/checkout/", "/api/"],
    },
  ],
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
  let sitemap: string | undefined

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
      sitemap = t.slice(8).trim()
    }
  }

  if (current) rules.push(current)

  if (rules.length === 0) return DEFAULT_RULES

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
    ...(sitemap && { sitemap }),
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/integrations-config`, {
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
