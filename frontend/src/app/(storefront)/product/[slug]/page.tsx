import type { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"
import { JsonLd } from "@/components/JsonLd"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"
import {
  buildProductGraph,
  type SchemaProductInput,
  type SchemaVariant,
  type SchemaReview,
  type SchemaSpec,
  type SchemaFAQ,
  type SchemaMerchantCentre,
  type SchemaCategory,
} from "@/lib/schema/product-schema"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "https://sapi.vastucart.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const headers = { "x-publishable-api-key": PUB_KEY }

/**
 * Convert a raw MinIO/S3 image URL to an absolute HTTPS URL.
 * Social crawlers and schema.org parsers need fully-qualified URLs.
 */
function toAbsoluteUrl(url: string | undefined | null): string {
  if (!url) return ""
  const match = url.match(/\/medusa-uploads\/(.+)$/)
  if (match) return `${SITE_URL}/api/img-proxy/${match[1]}`
  if (url.startsWith("http")) return url
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`
}

function parseJsonMeta<T>(meta: Record<string, unknown> | undefined, key: string, fallback: T): T {
  if (!meta?.[key]) return fallback
  const raw = meta[key]
  try {
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T
  } catch {
    return fallback
  }
}

type RawProduct = {
  id: string
  handle: string
  title: string
  subtitle?: string
  description?: string
  thumbnail?: string
  images?: { id: string; url: string }[]
  tags?: { id: string; value: string }[]
  categories?: { id: string; name: string; handle: string }[]
  options?: { id: string; title: string }[]
  variants?: {
    id: string
    title?: string
    sku?: string
    inventory_quantity?: number
    manage_inventory?: boolean
    options?: { option_id: string; value: string }[]
    prices?: { amount: number; currency_code: string }[]
  }[]
  metadata?: Record<string, unknown>
}

async function fetchProduct(slug: string): Promise<RawProduct | null> {
  const fields = [
    "id", "title", "handle", "subtitle", "description", "thumbnail",
    "metadata", "tags.id", "tags.value",
    "categories.id", "categories.name", "categories.handle",
    "images.id", "images.url",
    "options.id", "options.title",
    "variants.id", "variants.title", "variants.sku",
    "variants.inventory_quantity", "variants.manage_inventory",
    "variants.options.option_id", "variants.options.value",
    "variants.prices.amount", "variants.prices.currency_code",
  ].join(",")

  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?handle=${encodeURIComponent(slug)}&fields=${fields}`,
      { headers, next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.products?.[0] || null
  } catch {
    return null
  }
}

async function fetchReviews(productId: string) {
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products/${productId}/reviews`,
      { headers, next: { revalidate: 3600 } }
    )
    if (!res.ok) return { reviews: [], rating_breakdown: { average: 0, total: 0 } }
    return await res.json()
  } catch {
    return { reviews: [], rating_breakdown: { average: 0, total: 0 } }
  }
}

function buildSchemaInput(
  p: RawProduct,
  reviewData: { reviews: unknown[]; rating_breakdown: { average: number; total: number } }
): SchemaProductInput {
  const meta = (p.metadata || {}) as Record<string, unknown>

  // Build option_id → option title lookup for variant option decoding
  const optIdToTitle: Record<string, string> = {}
  for (const opt of p.options || []) {
    optIdToTitle[opt.id] = opt.title
  }

  // Canonical schema currency follows CLAUDE.md: India is the primary region,
  // so prefer INR — but if an international-only product has no INR price,
  // emit USD instead so the schema doesn't lie about pricing.
  const hasAnyInr = (p.variants || []).some((v) =>
    v.prices?.some((pr) => pr.currency_code?.toLowerCase() === "inr")
  )
  const preferredCurrency: "INR" | "USD" = hasAnyInr ? "INR" : "USD"

  const variants: SchemaVariant[] = (p.variants || []).map((v) => {
    const preferredPrice = v.prices?.find(
      (pr) => pr.currency_code?.toLowerCase() === preferredCurrency.toLowerCase()
    )
    const fallbackPrice = v.prices?.[0]
    const priceMinor = preferredPrice?.amount ?? fallbackPrice?.amount ?? 0
    const priceMajor = priceMinor / 100

    const options: Record<string, string> = {}
    for (const ov of v.options || []) {
      const title = optIdToTitle[ov.option_id] || "Variant"
      options[title] = ov.value
    }

    const inStock =
      v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0

    return {
      id: v.id,
      sku: v.sku || "",
      title: v.title,
      price: priceMajor,
      inStock,
      options,
    }
  })

  // Image list — thumbnail first (deduped), then gallery. All absolute URLs.
  const imageList: string[] = []
  const seen = new Set<string>()
  const pushImg = (url: string | undefined) => {
    if (!url) return
    const abs = toAbsoluteUrl(url)
    if (abs && !seen.has(abs)) {
      seen.add(abs)
      imageList.push(abs)
    }
  }
  pushImg(p.thumbnail)
  for (const img of p.images || []) pushImg(img.url)

  const merchantCentre = (meta.merchant_centre || {}) as SchemaMerchantCentre
  const specs = parseJsonMeta<SchemaSpec[]>(meta, "specs", [])
  const faqs = parseJsonMeta<SchemaFAQ[]>(meta, "faqs", [])

  const categories: SchemaCategory[] = (p.categories || []).map((c) => ({
    name: c.name,
    handle: c.handle,
  }))

  const reviewsArr = (reviewData.reviews || []) as Array<{
    id: string
    rating: number
    title?: string
    text?: string
    reviewerName?: string
    createdAt?: string
    created_at?: string
    reviewer_name?: string
  }>

  const reviews: SchemaReview[] = reviewsArr.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    text: r.text,
    reviewerName: r.reviewerName || r.reviewer_name || "Anonymous",
    createdAt: r.createdAt || r.created_at || new Date().toISOString(),
  }))

  return {
    id: p.id,
    slug: p.handle,
    title: p.title,
    description: p.description || p.subtitle || "",
    images: imageList,
    currency: preferredCurrency,
    variants,
    categories,
    merchantCentre,
    specs,
    faqs,
    reviews,
    aggregateRating:
      reviewData.rating_breakdown && reviewData.rating_breakdown.total > 0
        ? {
            average: reviewData.rating_breakdown.average,
            total: reviewData.rating_breakdown.total,
          }
        : null,
    tags: (p.tags || []).map((t) => t.value),
  }
}

// ─── Metadata (Open Graph / Twitter / canonical / Meta product tags) ──

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const [p, b] = await Promise.all([fetchProduct(slug), fetchBrandingForMetadata()])
  if (!p) return { title: `Product Not Found | ${b.storeName}` }

  const title = `${p.title} | ${b.storeName}`
  const description =
    (p.description && p.description.slice(0, 160)) ||
    (p.metadata?.seo_description as string | undefined) ||
    `Buy ${p.title} online at ${b.storeName} — India's trusted Vastu & wellness store.`

  const rawImage = p.thumbnail || p.images?.[0]?.url || ""
  const imageUrl = toAbsoluteUrl(rawImage)
  const pageUrl = `${SITE_URL}/product/${slug}`
  const keywords = p.tags?.length ? p.tags.map((t) => t.value).join(", ") : undefined

  // Meta product tags for Facebook/Instagram Dynamic Ads + Catalogue match.
  // Pick INR when the product is sold in India; otherwise emit the actual
  // currency of the first available price so feeds don't claim a price in a
  // currency the product isn't sold in.
  const firstVariant = p.variants?.[0]
  const inrPrice = firstVariant?.prices?.find(
    (pr) => pr.currency_code?.toLowerCase() === "inr"
  )
  const ogPrice = inrPrice ?? firstVariant?.prices?.[0]
  const ogCurrency = (ogPrice?.currency_code || "INR").toUpperCase()
  const priceMajor = ((ogPrice?.amount ?? 0) / 100).toFixed(2)
  const inStock =
    firstVariant?.manage_inventory === false ||
    (firstVariant?.inventory_quantity ?? 1) > 0
  const retailerItemId = firstVariant?.sku || p.id

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: b.storeName,
      ...(imageUrl
        ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: p.title }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    other: {
      "product:price:amount": priceMajor,
      "product:price:currency": ogCurrency,
      "product:availability": inStock ? "in stock" : "out of stock",
      "product:condition": "new",
      "product:retailer_item_id": retailerItemId,
    },
  }
}

// ─── Page component — fetches product + reviews, emits JSON-LD schema graph ─

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await fetchProduct(slug)

  if (!product) {
    return <ProductPageClient />
  }

  const reviewData = await fetchReviews(product.id)
  const schemaInput = buildSchemaInput(product, reviewData)
  const graph = buildProductGraph(schemaInput)

  return (
    <>
      <JsonLd data={graph} id="product-schema" />
      <ProductPageClient />
    </>
  )
}
