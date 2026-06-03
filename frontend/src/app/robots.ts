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

// AI-citation crawlers — ALLOWED. These fetch pages to cite us in AI answers
// (ChatGPT/Perplexity/Claude/Gemini/etc.), driving referral traffic. We want
// maximum visibility here. Same DISALLOW_DEFAULT applies (no private surfaces).
const CITATION_BOTS = [
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-User",
  "Claude-SearchBot",
  "Claude-Web",
  "Google-Extended",
  "Applebot-Extended",
  "DuckAssistBot",
  "YouBot",
  "PhindBot",
  "MistralAI-User",
  "Meta-ExternalFetcher",
]

// Pure training / scraper bots — BLOCKED. They take content for model training
// or SEO databases and return no citation, no traffic. Blocking them protects
// content + crawl budget without hurting discoverability or AI citations.
const BLOCKED_BOTS = [
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Diffbot",
  "cohere-ai",
  "ImagesiftBot",
  "Omgilibot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
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

/**
 * The curated bot policy is AUTHORITATIVE and always emitted: citation crawlers
 * allowed, training/scraper bots blocked, everyone else allowed with the
 * private-surface disallows. The admin robots.txt editor can only ADD extra
 * disallow paths to the `*` rule (merged below) — it cannot override the bot
 * policy, so a stale admin string can never silently drop our AI-citation rules.
 */
function buildRules(extraDisallow: string[] = []): MetadataRoute.Robots["rules"] {
  const starDisallow = Array.from(new Set([...DISALLOW_DEFAULT, ...extraDisallow]))
  return [
    ...CITATION_BOTS.map((ua) => ({ userAgent: ua, allow: "/", disallow: DISALLOW_DEFAULT })),
    ...BLOCKED_BOTS.map((ua) => ({ userAgent: ua, disallow: "/" })),
    { userAgent: "*", allow: "/", disallow: starDisallow },
  ]
}

function defaultRules(): MetadataRoute.Robots {
  return { rules: buildRules(), sitemap: ownSitemaps() }
}

/**
 * Parse a raw admin robots.txt only for the extra `*` disallow paths and any
 * Sitemap directives. The bot allow/block policy is NOT taken from the admin
 * string — it is always the curated buildRules() baseline. Sitemaps are
 * filtered to this subdomain's own origin (ownSitemaps), so a stale admin
 * value (parked .com / cross-cluster) can never poison the served file.
 */
function parseRobotsTxt(raw: string): MetadataRoute.Robots {
  const adminSitemaps: string[] = []
  const starDisallow: string[] = []
  let currentIsStar = false

  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const lower = t.toLowerCase()

    if (lower.startsWith("user-agent:")) {
      currentIsStar = t.slice(11).trim() === "*"
    } else if (lower.startsWith("disallow:") && currentIsStar) {
      const path = t.slice(9).trim()
      if (path && !DISALLOW_DEFAULT.includes(path)) starDisallow.push(path)
    } else if (lower.startsWith("sitemap:")) {
      const url = t.slice(8).trim()
      if (url) adminSitemaps.push(url)
    }
  }

  return {
    rules: buildRules(starDisallow),
    sitemap: ownSitemaps(adminSitemaps),
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
