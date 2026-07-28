import type { MetadataRoute } from "next"
import { normalizeImageUrl } from "@/lib/image-url"

// Render the sitemap dynamically (never statically cached at build) so it can
// never be frozen empty from a build that ran during a backend cutover, and
// always reflects the live catalog. Paired with cache:"no-store" fetches below.
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_983f495c4d12fe8c760e3f167e4da827c5ac78c6534604a43446592831d4a601"
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"

// Google allows 50,000 URLs per sitemap file. We paginate the full catalog up
// to this ceiling in one file; beyond it a sitemap-index (Next generateSitemaps)
// would be required — we log loudly rather than silently truncate.
const SITEMAP_URL_CAP = 50000
const PAGE_SIZE = 200

/**
 * Sitemap image URLs must be absolute. normalizeImageUrl() rewrites MinIO
 * paths to the relative /api/img-proxy route, so we absolutize against the
 * canonical site origin. Returns "" when there is no image.
 */
function absoluteImage(url: string | undefined | null): string {
  const n = normalizeImageUrl(url)
  if (!n) return ""
  if (n.startsWith("http://") || n.startsWith("https://")) return n
  return `${SITE_URL}${n.startsWith("/") ? "" : "/"}${n}`
}

interface MedusaProduct {
  id: string
  handle: string
  updated_at?: string
  thumbnail?: string | null
}
interface MedusaCategory {
  id: string
  handle: string
  updated_at?: string
  metadata?: { image_url?: string; hero_image?: string } | null
}
interface MedusaServiceType {
  slug?: string
}

/**
 * Fetch every row from a paginated Medusa store endpoint, following the
 * `count` total until exhausted (or the 50k cap). Fails soft → returns what
 * it has so a mid-pagination backend blip never empties the sitemap.
 */
async function fetchAllPaginated<T>(
  path: string,
  key: string,
  fetchOpts: RequestInit & { next?: { revalidate?: number } }
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  while (offset < SITEMAP_URL_CAP) {
    const sep = path.includes("?") ? "&" : "?"
    try {
      const res = await fetch(`${BACKEND_URL}${path}${sep}limit=${PAGE_SIZE}&offset=${offset}`, fetchOpts)
      if (!res.ok) break
      const d = (await res.json()) as Record<string, unknown>
      const batch = (d[key] as T[] | undefined) || []
      all.push(...batch)
      const count = typeof d.count === "number" ? d.count : all.length
      offset += PAGE_SIZE
      if (batch.length < PAGE_SIZE || offset >= count) break
    } catch {
      break
    }
  }
  if (all.length >= SITEMAP_URL_CAP) {
    console.warn(
      `[sitemap] hit ${SITEMAP_URL_CAP}-URL cap on ${path} — overflow omitted; migrate to a sitemap index (generateSitemaps).`
    )
  }
  return all
}

const STATIC_PAGES: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/contact`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    url: `${SITE_URL}/privacy-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/terms`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/shipping-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/refund-policy`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/gift-cards`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/consultations`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Check if sitemap is enabled in admin config
  try {
    const cfgRes = await fetch(`${BACKEND_URL}/store/integrations-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      cache: "no-store",
    })
    if (cfgRes.ok) {
      const data = await cfgRes.json()
      // If explicitly disabled, return empty (Google will stop indexing)
      if (data.seoDefaults?.sitemapEnabled === false) return []
    }
  } catch {
    // If we can't reach backend, still serve sitemap (fail open for SEO)
  }

  // ALWAYS fetch the catalog live (cache: "no-store"). The sitemap is crawled
  // infrequently, so per-request generation is cheap — and it makes poisoning
  // impossible: a previous build that ran during a backend boot/cutover window
  // (or any transient empty result) can never be cached and locked in for the
  // revalidate window. The sitemap therefore always mirrors the live catalog,
  // including products the owner adds or removes at any time.
  const storeHeaders = { "x-publishable-api-key": PUB_KEY }
  const fetchOpts = { headers: storeHeaders, cache: "no-store" as const }

  // Paginate the full catalog (products + categories); consultations are a small
  // fixed set. `thumbnail`/`images` + category metadata feed the image-sitemap
  // extension so product/category images become eligible for Google Images.
  const [products, categories, consultationsRes] = await Promise.all([
    fetchAllPaginated<MedusaProduct>(
      "/store/products?fields=id,handle,updated_at,thumbnail",
      "products",
      fetchOpts
    ),
    fetchAllPaginated<MedusaCategory>(
      "/store/product-categories?fields=id,handle,updated_at,metadata",
      "product_categories",
      fetchOpts
    ),
    fetch(`${BACKEND_URL}/store/bookings/service-types`, fetchOpts).catch(() => null),
  ])

  const productPages: MetadataRoute.Sitemap = products.map((p) => {
    const img = absoluteImage(p.thumbnail)
    return {
      url: `${SITE_URL}/product/${p.handle}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(img ? { images: [img] } : {}),
    }
  })

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => {
    const img = absoluteImage(c.metadata?.image_url || c.metadata?.hero_image)
    return {
      url: `${SITE_URL}/category/${c.handle}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
      ...(img ? { images: [img] } : {}),
    }
  })

  let consultationPages: MetadataRoute.Sitemap = []
  if (consultationsRes && consultationsRes.ok) {
    try {
      const d = (await consultationsRes.json()) as { service_types?: MedusaServiceType[] }
      consultationPages = (d.service_types || [])
        .filter((s): s is Required<MedusaServiceType> => Boolean(s.slug))
        .map((s) => ({
          url: `${SITE_URL}/consultations/${s.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
    } catch {
      consultationPages = []
    }
  }

  return [...STATIC_PAGES, ...productPages, ...categoryPages, ...consultationPages]
}
