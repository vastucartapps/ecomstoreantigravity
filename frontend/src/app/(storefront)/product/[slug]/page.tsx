"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProductDetail } from "@/components/storefront/product-experience"
import { useWishlist } from "@/providers/wishlist-provider"
import { useCart } from "@/providers/cart-provider"
import { useAuth } from "@/providers/auth-provider"
import type {
  Product,
  ProductImage,
  ProductVariant,
  VariantAttribute,
  SwatchValue,
  RichContentBlock,
  SpecificationGroup,
  ProductFAQ,
  ProductQuestion,
  ProductReview,
  RatingBreakdown,
  RelatedProduct,
} from "@/types/product-experience"
import { bg, primary, earth, fonts } from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"
import { getRegionId } from "@/lib/region"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const headers: Record<string, string> = {
  "x-publishable-api-key":
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
}

// ─── Helpers to map Medusa API data to our types ────────────

function mapImages(p: any): ProductImage[] {
  const images: ProductImage[] = []

  if (p.thumbnail) {
    images.push({
      id: "thumb-0",
      url: normalizeImageUrl(p.thumbnail),
      alt: p.title || "",
      type: "primary",
      order: 0,
    })
  }

  if (p.images) {
    p.images.forEach((img: any, idx: number) => {
      // Avoid duplicate if thumbnail is same as first image
      if (img.url === p.thumbnail && idx === 0) return
      images.push({
        id: img.id || `img-${idx}`,
        url: normalizeImageUrl(img.url),
        alt: p.title || "",
        type: "gallery",
        order: images.length,
      })
    })
  }

  return images
}

function mapVariants(p: any): ProductVariant[] {
  // Build a lookup: option_id → option title (e.g. "opt_abc" → "Size")
  const optionIdToTitle: Record<string, string> = {}
  for (const opt of p.options || []) {
    optionIdToTitle[opt.id] = opt.title
  }

  return (p.variants || []).map((v: any) => {
    const cp = v.calculated_price
    const price = (cp?.calculated_amount ?? 0) / 100
    const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
    const inStock =
      v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0

    // Medusa v2: variant.options is an ARRAY of { id, value, option_id }
    const attributes: Record<string, string> = {}
    if (Array.isArray(v.options)) {
      for (const optVal of v.options) {
        const title = optionIdToTitle[optVal.option_id] || "Variant"
        attributes[title] = optVal.value
      }
    }
    // Fallback: if options array was empty/missing, use variant title
    if (Object.keys(attributes).length === 0 && v.title) {
      const fallbackTitle = p.options?.[0]?.title || "Variant"
      attributes[fallbackTitle] = v.title
    }

    return {
      id: v.id,
      attributes,
      sku: v.sku || "",
      price,
      mrp,
      inStock,
      stockCount: v.inventory_quantity ?? 999,
      colorSwatch: null,
    }
  })
}

function buildVariantAttributes(p: any): VariantAttribute[] {
  if ((p.variants?.length || 0) <= 1) return []
  if (!p.options?.length) return []

  // Skip if only "Default" option
  if (p.options.length === 1 && p.options[0].title?.toLowerCase() === "default") return []

  // Medusa v2: variant.options is ARRAY of { id, value, option_id }
  // Build attributes from product options, collecting unique values per option
  return p.options.map((opt: any) => {
    const uniqueValues = new Set<string>()

    for (const v of p.variants || []) {
      if (Array.isArray(v.options)) {
        // Proper path: match option_id to find the value for this option
        const match = v.options.find((ov: any) => ov.option_id === opt.id)
        if (match?.value) uniqueValues.add(match.value)
      }
    }

    // Fallback: if no structured options found, use variant titles
    if (uniqueValues.size === 0) {
      for (const v of p.variants || []) {
        if (v.title) uniqueValues.add(v.title)
      }
    }

    return {
      name: opt.title,
      label: opt.title,
      type: "dropdown" as const,
      values: Array.from(uniqueValues),
    }
  }).filter((attr: VariantAttribute) => attr.values.length > 0)
}

function mapProduct(p: any, reviewCount: number, rating: number): Product {
  const variant = p.variants?.[0]
  const cp = variant?.calculated_price
  const price = (cp?.calculated_amount ?? 0) / 100
  const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
  const currencyCode = (cp?.currency_code || "inr").toUpperCase()
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  const meta = p.metadata || {}

  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    description: p.description || "",
    shortDescription:
      p.subtitle ||
      meta.short_description ||
      (p.description || "").slice(0, 200) + (p.description?.length > 200 ? "..." : ""),
    currency: currencyCode === "USD" ? "USD" : "INR",
    price,
    mrp,
    discountPercent: discount,
    rating,
    reviewCount,
    inStock:
      p.variants?.some(
        (v: any) =>
          v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0
      ) ?? true,
    sku: variant?.sku || p.handle || "",
    isNew:
      !!meta.is_new ||
      (p.created_at &&
        (Date.now() - new Date(p.created_at).getTime()) / 86400000 <= 30),
    expressShipping: meta.express_shipping === "true",
    deliveryEstimate: meta.delivery_estimate || "3-5 business days",
    returnPolicy: meta.return_policy || "7-day easy returns",
  }
}

function parseMetadataJson<T>(meta: any, key: string, fallback: T): T {
  if (!meta?.[key]) return fallback
  try {
    const parsed = typeof meta[key] === "string" ? JSON.parse(meta[key]) : meta[key]
    return parsed as T
  } catch {
    return fallback
  }
}

function mapRelatedProducts(
  products: any[],
  currencyCode: string
): RelatedProduct[] {
  return products.map((p: any) => {
    const variant = p.variants?.[0]
    const cp = variant?.calculated_price
    const price = (cp?.calculated_amount ?? 0) / 100
    const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
    const cc = (cp?.currency_code || "inr").toUpperCase()

    return {
      id: p.id,
      name: p.title,
      slug: p.handle,
      imageUrl: normalizeImageUrl(p.thumbnail || p.images?.[0]?.url || ""),
      price,
      mrp,
      currency: cc === "USD" ? "USD" : "INR",
      rating: p.metadata?.rating ? Number(p.metadata.rating) : 0,
      reviewCount: p.metadata?.review_count
        ? Number(p.metadata.review_count)
        : 0,
      variantCount: p.variants?.length || 1,
      isNew:
        !!p.metadata?.is_new ||
        (p.created_at &&
          (Date.now() - new Date(p.created_at).getTime()) / 86400000 <= 30),
      inStock:
        p.variants?.some(
          (v: any) =>
            v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0
        ) ?? true,
    }
  })
}

// ─── Loading skeleton ────────────────────────────────

function PDPSkeleton() {
  return (
    <div style={{ background: bg.primary, minHeight: "100vh" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb skeleton */}
        <div className="flex gap-2 mb-6">
          <div className="h-4 w-12 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
          <div className="h-4 w-4 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
          <div className="h-4 w-24 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
          <div className="h-4 w-4 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
          <div className="h-4 w-40 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Image skeleton */}
          <div className="lg:w-[45%]">
            <div className="aspect-square rounded-2xl animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="flex gap-2.5 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[72px] h-[72px] rounded-xl animate-pulse" style={{ background: "#e8e0d8" }} />
              ))}
            </div>
          </div>

          {/* Info skeleton */}
          <div className="flex-1 space-y-4">
            <div className="h-8 w-3/4 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-4 w-40 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-4 w-full rounded animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-px w-full" style={{ background: "#f0ebe4" }} />
            <div className="h-10 w-48 rounded animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-12 w-full rounded-xl animate-pulse" style={{ background: "#e8e0d8" }} />
            <div className="h-12 w-full rounded-xl animate-pulse" style={{ background: "#e8e0d8" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page component ────────────────────────────

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string

  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [images, setImages] = useState<ProductImage[]>([])
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [variantAttributes, setVariantAttributes] = useState<VariantAttribute[]>([])
  const [richContent, setRichContent] = useState<RichContentBlock[]>([])
  const [specificationGroups, setSpecificationGroups] = useState<SpecificationGroup[]>([])
  const [faqs, setFaqs] = useState<ProductFAQ[]>([])
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [ratingBreakdown, setRatingBreakdown] = useState<RatingBreakdown>({
    average: 0,
    total: 0,
    distribution: {},
  })
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [rawProductId, setRawProductId] = useState("")

  const fetchProductData = useCallback(async () => {
    setIsLoading(true)

    try {
      // 1. Fetch region for pricing (shared cached utility)
      const regionId = await getRegionId()
      const regionParam = regionId ? `&region_id=${regionId}` : ""
      const productFields =
        "id,title,handle,subtitle,description,thumbnail,created_at,metadata,status,options.id,options.title,options.values.id,options.values.value,variants.id,variants.title,variants.sku,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,variants.options.id,variants.options.value,variants.options.option_id,images.id,images.url,categories.id,categories.name,categories.handle"

      // 2. Fetch product by handle
      const prodRes = await fetch(
        `${BACKEND_URL}/store/products?handle=${slug}&fields=${productFields}${regionParam}`,
        { headers }
      )
      const prodData = await prodRes.json()
      const rawProduct = prodData.products?.[0]

      if (!rawProduct) {
        setIsLoading(false)
        return
      }

      setRawProductId(rawProduct.id)

      // 3. Fetch reviews, questions, and related products in parallel
      const categoryIds = (rawProduct.categories || []).map((c: any) => c.id)
      const categoryParam = categoryIds.length > 0
        ? categoryIds.map((id: string) => `category_id[]=${id}`).join("&")
        : ""

      const [reviewsRes, questionsRes, relatedRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/store/products/${rawProduct.id}/reviews`, { headers }).then((r) => r.json()),
        fetch(`${BACKEND_URL}/store/products/${rawProduct.id}/questions`, { headers }).then((r) => r.json()),
        categoryParam
          ? fetch(
              `${BACKEND_URL}/store/products?${categoryParam}&limit=10&fields=id,title,handle,thumbnail,created_at,metadata,variants.id,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,images.url${regionParam}`,
              { headers }
            ).then((r) => r.json())
          : Promise.resolve({ products: [] }),
      ])

      // Process reviews
      let reviewData: ProductReview[] = []
      let ratingData: RatingBreakdown = { average: 0, total: 0, distribution: {} }
      if (reviewsRes.status === "fulfilled") {
        reviewData = reviewsRes.value.reviews || []
        ratingData = reviewsRes.value.rating_breakdown || ratingData
      }

      // Process questions
      let questionData: ProductQuestion[] = []
      if (questionsRes.status === "fulfilled") {
        questionData = questionsRes.value.questions || []
      }

      // Process related products (exclude current product)
      let relatedData: RelatedProduct[] = []
      if (relatedRes.status === "fulfilled") {
        const related = (relatedRes.value.products || []).filter(
          (p: any) => p.id !== rawProduct.id
        )
        relatedData = mapRelatedProducts(related, "inr")
      }

      // Extract metadata-based content
      const meta = rawProduct.metadata || {}

      // Set all state
      const mappedProduct = mapProduct(rawProduct, ratingData.total, ratingData.average)
      setProduct(mappedProduct)
      setImages(mapImages(rawProduct))
      setVariants(mapVariants(rawProduct))
      setVariantAttributes(buildVariantAttributes(rawProduct))
      setRichContent(parseMetadataJson<RichContentBlock[]>(meta, "rich_content", []))
      setSpecificationGroups(parseMetadataJson<SpecificationGroup[]>(meta, "specifications", []))
      setFaqs(parseMetadataJson<ProductFAQ[]>(meta, "faqs", []))
      setQuestions(questionData)
      setReviews(reviewData)
      setRatingBreakdown(ratingData)
      setRelatedProducts(relatedData)
    } catch (err) {
      console.error("Failed to fetch product:", err)
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) fetchProductData()
  }, [slug, fetchProductData])

  const handleAddToCart = async (variantId: string, quantity: number) => {
    try {
      if (variantId) {
        await addItem(variantId, quantity)
      }
    } catch (err) {
      console.error("Add to cart failed:", err)
    }
  }

  const handleToggleWishlist = async (productId: string) => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId, "")
      } else {
        await addToWishlist(productId, "")
      }
    } catch (err: any) {
      if (err?.message === "LOGIN_REQUIRED") {
        router.push("/login")
        return
      }
      console.error("Wishlist toggle failed:", err)
    }
  }

  const handleShare = (channel: "whatsapp" | "facebook" | "pinterest" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    const text = product ? `Check out ${product.name}` : "Check out this product"

    switch (channel) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank")
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
        break
      case "pinterest":
        window.open(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`, "_blank")
        break
      case "copy":
        navigator.clipboard?.writeText(url)
        break
    }
  }

  const handleAskQuestion = async (question: string) => {
    try {
      await fetch(`${BACKEND_URL}/store/products/${rawProductId}/questions`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ question, asked_by: "Customer" }),
      })
      // Refresh questions
      const res = await fetch(`${BACKEND_URL}/store/products/${rawProductId}/questions`, { headers })
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err) {
      console.error("Failed to submit question:", err)
    }
  }

  // Build breadcrumbs from product categories
  const breadcrumbs = [
    { label: "Home", href: "/" },
    ...(product
      ? [{ label: product.name, href: null }]
      : [{ label: slug ? decodeURIComponent(slug).replace(/-/g, " ") : "Product", href: null }]),
  ]

  if (isLoading) return <PDPSkeleton />

  if (!product) {
    return (
      <div style={{ background: bg.primary, minHeight: "70vh" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ color: earth[700], fontFamily: fonts.heading }}
          >
            Product Not Found
          </h1>
          <p className="text-sm mb-6" style={{ color: earth[400], fontFamily: fonts.body }}>
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary[500], fontFamily: fonts.body }}
          >
            Browse All Products
          </button>
        </div>
      </div>
    )
  }

  // ─── MerchantListing JSON-LD (MTSD Module 3) ───────────────────
  // Adds rich merchant schema for Google Shopping eligibility.
  const merchantListingJsonLd = product
    ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        name: product.name,
        description: product.description,
        url: typeof window !== "undefined" ? window.location.href : `${BACKEND_URL.replace("sapi.", "store.")}/product/${product.slug}`,
        image: images.map((img) => img.url).filter(Boolean),
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: "VastuCart",
        },
        offers: variants.length > 0
          ? variants.map((v) => ({
              "@type": "Offer",
              sku: v.sku || product.sku,
              price: v.price.toFixed(2),
              priceCurrency: product.currency || "INR",
              availability: v.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: typeof window !== "undefined" ? window.location.href : "",
              priceValidUntil: new Date(Date.now() + 30 * 86400000)
                .toISOString()
                .split("T")[0],
              hasMerchantReturnPolicy: {
                "@type": "MerchantReturnPolicy",
                applicableCountry: "IN",
                returnPolicyCategory:
                  "https://schema.org/MerchantReturnFiniteReturnWindow",
                merchantReturnDays: 7,
                returnMethod: "https://schema.org/ReturnByMail",
                returnFees: "https://schema.org/FreeReturn",
              },
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: {
                  "@type": "MonetaryAmount",
                  value: "0",
                  currency: "INR",
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
                shippingDestination: {
                  "@type": "DefinedRegion",
                  addressCountry: "IN",
                },
              },
            }))
          : {
              "@type": "Offer",
              price: product.price.toFixed(2),
              priceCurrency: product.currency || "INR",
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
        ...(ratingBreakdown.total > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: ratingBreakdown.average.toFixed(1),
                reviewCount: ratingBreakdown.total,
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
      }
    : null

  return (
    <>
      {merchantListingJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(merchantListingJsonLd) }}
        />
      )}
      <ProductDetail
        product={product}
        images={images}
        variants={variants}
        variantAttributes={variantAttributes}
        richContent={richContent}
        specificationGroups={specificationGroups}
        faqs={faqs}
        questions={questions}
        reviews={reviews}
        ratingBreakdown={ratingBreakdown}
        relatedProducts={relatedProducts}
        breadcrumbs={breadcrumbs}
        isWishlisted={!!rawProductId && isInWishlist(rawProductId)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onShare={handleShare}
        onVariantChange={() => {}}
        onAskQuestion={handleAskQuestion}
        onProductClick={(s) => router.push(`/product/${s}`)}
        onQuickView={(id) => router.push(`/product/${id}`)}
        onBreadcrumbClick={(href) => router.push(href)}
        onScrollToReviews={() => {}}
      />
    </>
  )
}
