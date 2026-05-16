/**
 * Enterprise-grade schema.org JSON-LD builder for product pages.
 * Emits: Product, AggregateOffer + per-variant Offer, AggregateRating,
 * Review[], BreadcrumbList, FAQPage — all wired into a single @graph.
 *
 * All entities are cross-referenced via @id so Google's parser treats them
 * as one connected knowledge graph, which is what powers rich results
 * (star ratings, price, availability, FAQ accordion, breadcrumb trail).
 *
 * Brand-name fallback uses BRAND_DEFAULTS so a single edit to the
 * canonical brand seed propagates here. Per-product `merchant_centre.brand`
 * still overrides if set.
 */
import { BRAND_DEFAULTS } from "@/lib/brand-defaults"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const ORG_ID = `${SITE_URL}/#organization`

// ─── Input shapes ────────────────────────────────────────────────

export interface SchemaMerchantCentre {
  gtin?: string
  mpn?: string
  brand?: string
  condition?: "new" | "refurbished" | "used"
  ageGroup?: string
  gender?: string
  googleCategory?: string
}

export interface SchemaSpec {
  label?: string
  value: string
  group?: string
}

export interface SchemaFAQ {
  question: string
  answer: string
}

export interface SchemaReview {
  id: string
  rating: number
  title?: string
  text?: string
  reviewerName: string
  createdAt: string
}

export interface SchemaVariant {
  id: string
  sku: string
  title?: string
  price: number // in major units (rupees), not paise
  inStock: boolean
  options?: Record<string, string> // e.g. { Size: "M", Color: "Red" }
}

export interface SchemaCategory {
  name: string
  handle: string
}

export interface SchemaProductInput {
  id: string
  slug: string
  title: string
  description: string
  images: string[] // absolute HTTPS URLs, already normalized
  currency: "INR" | "USD"
  variants: SchemaVariant[]
  categories: SchemaCategory[]
  merchantCentre: SchemaMerchantCentre
  specs: SchemaSpec[]
  faqs: SchemaFAQ[]
  reviews: SchemaReview[]
  aggregateRating: { average: number; total: number } | null
  tags: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────

function availabilityUrl(inStock: boolean): string {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock"
}

function conditionUrl(condition?: string): string {
  switch (condition) {
    case "refurbished":
      return "https://schema.org/RefurbishedCondition"
    case "used":
      return "https://schema.org/UsedCondition"
    case "new":
    default:
      return "https://schema.org/NewCondition"
  }
}

/** ISO date 1 year from now — Google requires priceValidUntil for Merchant listings */
function priceValidUntil(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split("T")[0]
}

function cleanText(s: string | undefined | null, max = 5000): string {
  if (!s) return ""
  // Strip HTML, collapse whitespace, cap length. Google tolerates HTML in
  // descriptions but plain text is more portable.
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

/** Extract color from variant options across all variants, deduped. */
function collectColors(variants: SchemaVariant[]): string[] {
  const set = new Set<string>()
  for (const v of variants) {
    const opts = v.options || {}
    for (const [k, val] of Object.entries(opts)) {
      if (/color|colour/i.test(k) && val) set.add(val)
    }
  }
  return Array.from(set)
}

/** Extract a spec value by fuzzy label match. */
function findSpec(specs: SchemaSpec[], ...needles: string[]): string | undefined {
  for (const s of specs) {
    const label = (s.label || "").toLowerCase()
    for (const needle of needles) {
      if (label.includes(needle.toLowerCase())) return s.value
    }
  }
  return undefined
}

// ─── Entity builders ─────────────────────────────────────────────

function buildBreadcrumb(
  slug: string,
  title: string,
  category: SchemaCategory | undefined
) {
  const items: object[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ]

  if (category) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: category.name,
      item: `${SITE_URL}/category/${category.handle}`,
    })
    items.push({
      "@type": "ListItem",
      position: 3,
      name: title,
      item: `${SITE_URL}/product/${slug}`,
    })
  } else {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${SITE_URL}/product/${slug}`,
    })
  }

  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}/product/${slug}#breadcrumb`,
    itemListElement: items,
  }
}

function buildFAQPage(slug: string, faqs: SchemaFAQ[]) {
  if (!faqs.length) return null
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/product/${slug}#faq`,
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: cleanText(f.question, 500),
      acceptedAnswer: {
        "@type": "Answer",
        text: cleanText(f.answer, 2000),
      },
    })),
  }
}

function buildReviews(slug: string, reviews: SchemaReview[]) {
  return reviews.slice(0, 20).map((r) => ({
    "@type": "Review",
    "@id": `${SITE_URL}/product/${slug}#review-${r.id}`,
    author: {
      "@type": "Person",
      name: r.reviewerName || "Anonymous",
    },
    datePublished: r.createdAt,
    reviewRating: {
      "@type": "Rating",
      ratingValue: Math.max(1, Math.min(5, r.rating)),
      bestRating: 5,
      worstRating: 1,
    },
    ...(r.title ? { name: cleanText(r.title, 200) } : {}),
    ...(r.text ? { reviewBody: cleanText(r.text, 3000) } : {}),
  }))
}

function buildShippingDetails(currency: "INR" | "USD") {
  // VastuCart offers free shipping across India.
  // Emit one valid ShippingRate — Google uses this for the free-shipping badge.
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: 0,
      currency,
    },
    shippingDestination: {
      "@type": "DefinedRegion",
      addressCountry: currency === "INR" ? "IN" : "US",
    },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 0,
        maxValue: 1,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 2,
        maxValue: 5,
        unitCode: "DAY",
      },
    },
  }
}

function buildReturnPolicy(currency: "INR" | "USD") {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: currency === "INR" ? "IN" : "US",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 7,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
  }
}

function buildOffers(input: SchemaProductInput) {
  const { slug, variants, currency, merchantCentre } = input
  const validUntil = priceValidUntil()
  const sellerRef = { "@id": ORG_ID }
  const condition = conditionUrl(merchantCentre.condition)
  const shipping = buildShippingDetails(currency)
  const returns = buildReturnPolicy(currency)

  const offerList = variants.map((v) => {
    const offerUrl = `${SITE_URL}/product/${slug}?variant=${v.id}`
    return {
      "@type": "Offer",
      "@id": `${offerUrl}#offer`,
      name: v.title || v.sku,
      sku: v.sku,
      price: v.price.toFixed(2),
      priceCurrency: currency,
      priceValidUntil: validUntil,
      availability: availabilityUrl(v.inStock),
      itemCondition: condition,
      url: offerUrl,
      seller: sellerRef,
      hasMerchantReturnPolicy: returns,
      shippingDetails: shipping,
    }
  })

  if (offerList.length === 1) return offerList[0]

  const prices = variants.map((v) => v.price).filter((p) => p > 0)
  const lowPrice = prices.length ? Math.min(...prices) : 0
  const highPrice = prices.length ? Math.max(...prices) : 0
  const anyInStock = variants.some((v) => v.inStock)

  return {
    "@type": "AggregateOffer",
    "@id": `${SITE_URL}/product/${slug}#offer`,
    priceCurrency: currency,
    lowPrice: lowPrice.toFixed(2),
    highPrice: highPrice.toFixed(2),
    offerCount: offerList.length,
    availability: availabilityUrl(anyInStock),
    itemCondition: condition,
    seller: sellerRef,
    offers: offerList,
  }
}

function buildProduct(input: SchemaProductInput, breadcrumbId: string) {
  const {
    id,
    slug,
    title,
    description,
    images,
    variants,
    categories,
    merchantCentre,
    specs,
    tags,
    aggregateRating,
    reviews,
  } = input

  const colors = collectColors(variants)
  const material = findSpec(specs, "material", "made of")
  const size = findSpec(specs, "size", "dimension")
  const weight = findSpec(specs, "weight")
  const mainCategory = categories[0]
  const primarySku = variants[0]?.sku || id

  const additionalProperty = specs
    .filter((s) => s.label && s.value)
    .slice(0, 50)
    .map((s) => ({
      "@type": "PropertyValue",
      name: s.label,
      value: s.value,
      ...(s.group ? { propertyID: s.group } : {}),
    }))

  const productSchema: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${SITE_URL}/product/${slug}#product`,
    name: title,
    description: cleanText(description) ||
      `Buy ${title} at ${BRAND_DEFAULTS.storeName} — authentic spiritual products delivered across India.`,
    image: images.length ? images : [`${SITE_URL}/opengraph-image`],
    url: `${SITE_URL}/product/${slug}`,
    sku: primarySku,
    productID: id,
    brand: {
      "@type": "Brand",
      name: merchantCentre.brand || BRAND_DEFAULTS.storeName,
    },
    itemCondition: conditionUrl(merchantCentre.condition),
    offers: buildOffers(input),
    breadcrumb: { "@id": breadcrumbId },
  }

  // Optional fields — only emit if populated (Google warns on empty values)
  if (merchantCentre.gtin) productSchema.gtin = merchantCentre.gtin
  if (merchantCentre.mpn) productSchema.mpn = merchantCentre.mpn
  if (merchantCentre.googleCategory) productSchema.category = merchantCentre.googleCategory
  else if (mainCategory) productSchema.category = mainCategory.name

  if (colors.length === 1) productSchema.color = colors[0]
  else if (colors.length > 1) productSchema.color = colors

  if (material) productSchema.material = material
  if (size) productSchema.size = size
  if (weight) {
    productSchema.weight = {
      "@type": "QuantitativeValue",
      value: weight,
    }
  }

  if (merchantCentre.ageGroup) productSchema.audience = {
    "@type": "PeopleAudience",
    suggestedMinAge: merchantCentre.ageGroup === "adult" ? 18 : undefined,
  }

  if (tags.length) productSchema.keywords = tags.join(", ")

  if (additionalProperty.length) {
    productSchema.additionalProperty = additionalProperty
  }

  if (aggregateRating && aggregateRating.total > 0) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateRating.average.toFixed(1),
      reviewCount: aggregateRating.total,
      bestRating: 5,
      worstRating: 1,
    }
  }

  if (reviews.length) {
    productSchema.review = buildReviews(slug, reviews)
  }

  return productSchema
}

// ─── Public API ──────────────────────────────────────────────────

export function buildProductGraph(input: SchemaProductInput) {
  const breadcrumbId = `${SITE_URL}/product/${input.slug}#breadcrumb`
  const breadcrumb = buildBreadcrumb(
    input.slug,
    input.title,
    input.categories[0]
  )
  const product = buildProduct(input, breadcrumbId)
  const faq = buildFAQPage(input.slug, input.faqs)

  const graph: object[] = [product, breadcrumb]
  if (faq) graph.push(faq)

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  }
}
