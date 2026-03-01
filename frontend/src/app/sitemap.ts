import type { MetadataRoute } from "next"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://vastucart.com"

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
      next: { revalidate: 3600 },
    })
    if (cfgRes.ok) {
      const data = await cfgRes.json()
      // If explicitly disabled, return empty (Google will stop indexing)
      if (data.seoDefaults?.sitemapEnabled === false) return []
    }
  } catch {
    // If we can't reach backend, still serve sitemap (fail open for SEO)
  }

  const storeHeaders = { "x-publishable-api-key": PUB_KEY }
  const fetchOpts = { headers: storeHeaders, next: { revalidate: 3600 } }

  // Fetch products, categories, and consultation service types in parallel
  const [productsRes, categoriesRes, consultationsRes] = await Promise.allSettled([
    fetch(
      `${BACKEND_URL}/store/products?limit=500&fields=id,handle,updated_at`,
      fetchOpts
    ),
    fetch(
      `${BACKEND_URL}/store/product-categories?limit=200&fields=id,handle,updated_at`,
      fetchOpts
    ),
    fetch(
      `${BACKEND_URL}/store/bookings/service-types`,
      fetchOpts
    ),
  ])

  const productPages: MetadataRoute.Sitemap =
    productsRes.status === "fulfilled" && productsRes.value.ok
      ? await productsRes.value
          .json()
          .then((d: any) =>
            (d.products || []).map((p: any) => ({
              url: `${SITE_URL}/product/${p.handle}`,
              lastModified: p.updated_at
                ? new Date(p.updated_at)
                : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.8,
            }))
          )
          .catch(() => [])
      : []

  const categoryPages: MetadataRoute.Sitemap =
    categoriesRes.status === "fulfilled" && categoriesRes.value.ok
      ? await categoriesRes.value
          .json()
          .then((d: any) =>
            (d.product_categories || []).map((c: any) => ({
              url: `${SITE_URL}/category/${c.handle}`,
              lastModified: c.updated_at
                ? new Date(c.updated_at)
                : new Date(),
              changeFrequency: "weekly" as const,
              priority: 0.7,
            }))
          )
          .catch(() => [])
      : []

  const consultationPages: MetadataRoute.Sitemap =
    consultationsRes.status === "fulfilled" && consultationsRes.value.ok
      ? await consultationsRes.value
          .json()
          .then((d: any) =>
            (d.service_types || [])
              .filter((s: any) => s.slug)
              .map((s: any) => ({
                url: `${SITE_URL}/consultations/${s.slug}`,
                lastModified: new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.8,
              }))
          )
          .catch(() => [])
      : []

  return [...STATIC_PAGES, ...productPages, ...categoryPages, ...consultationPages]
}
