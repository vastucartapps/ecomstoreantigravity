"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Homepage } from "@/components/storefront/Homepage"
import { QuickViewModal } from "@/components/storefront/product-experience"
import { useWishlist } from "@/providers/wishlist-provider"
import { useCart } from "@/providers/cart-provider"
import { medusa } from "@/lib/medusa"
import type {
  HeroSlide,
  CategoryCard,
  StorefrontProduct,
  DealProduct,
  Testimonial,
  TrustBadge,
} from "@/types/storefront"
import type {
  Product,
  ProductImage,
  ProductVariant,
  VariantAttribute,
} from "@/types/product-experience"
import { bg, primary, earth, fonts } from "@/lib/theme"
import type { HomepageSection } from "@/types/admin-storefront"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const TRUST_BADGES: TrustBadge[] = [
  {
    id: "badge-1",
    label: "Free Shipping",
    sublabel: "On orders above ₹999",
    icon: "truck",
  },
  {
    id: "badge-2",
    label: "Secure Payment",
    sublabel: "100% protected checkout",
    icon: "shield",
  },
  {
    id: "badge-3",
    label: "Easy Returns",
    sublabel: "7-day return policy",
    icon: "refresh",
  },
  {
    id: "badge-4",
    label: "Authentic Products",
    sublabel: "Certified & genuine",
    icon: "badge-check",
  },
]

function mapMedusaProduct(p: any): StorefrontProduct {
  const variant = p.variants?.[0]
  const cp = variant?.calculated_price

  // calculated_price amounts are already in minor units (paise), convert to major units (rupees)
  const rawPrice = cp?.calculated_amount ?? 0
  const rawOriginal = cp?.original_amount ?? rawPrice
  const currencyCode = cp?.currency_code || "inr"

  // Medusa stores amounts in minor units (paise for INR, cents for USD)
  const price = rawPrice / 100
  const mrp = rawOriginal / 100

  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    imageUrl: p.thumbnail || p.images?.[0]?.url || "",
    price,
    mrp,
    currency: currencyCode.toUpperCase() === "USD" ? "USD" : "INR",
    rating: p.metadata?.rating ? Number(p.metadata.rating) : 0,
    reviewCount: p.metadata?.review_count ? Number(p.metadata.review_count) : 0,
    variantCount: p.variants?.length || 1,
    isNew: !!p.metadata?.is_new || isNewProduct(p.created_at),
    inStock: p.variants?.some((v: any) => v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0) ?? true,
  }
}

function isNewProduct(createdAt: string): boolean {
  if (!createdAt) return false
  const daysOld = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysOld <= 30
}

function mapMedusaCategory(c: any): CategoryCard {
  return {
    id: c.id,
    name: c.name,
    imageUrl: c.metadata?.image_url || `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop`,
    slug: c.handle,
    productCount: c.products?.length ?? 0,
  }
}

// Loading skeleton
function HomepageSkeleton() {
  return (
    <div style={{ background: bg.primary }}>
      {/* Hero skeleton */}
      <div
        className="animate-pulse"
        style={{ height: 420, background: primary[500], opacity: 0.3 }}
      />
      {/* Category skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="h-8 w-48 rounded mb-6 animate-pulse mx-auto"
          style={{ background: "#e8e0d8" }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl animate-pulse"
              style={{ background: "#e8e0d8" }}
            />
          ))}
        </div>
      </div>
      {/* Products skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div
          className="h-8 w-48 rounded mb-6 animate-pulse"
          style={{ background: "#e8e0d8" }}
        />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[240px] flex-shrink-0">
              <div
                className="aspect-square rounded-t-xl animate-pulse"
                style={{ background: "#e8e0d8" }}
              />
              <div className="p-3.5 space-y-2" style={{ background: "#fff" }}>
                <div
                  className="h-4 rounded animate-pulse"
                  style={{ background: "#e8e0d8", width: "80%" }}
                />
                <div
                  className="h-5 rounded animate-pulse"
                  style={{ background: "#e8e0d8", width: "40%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── QuickView helpers ────────────────────────────────────

function mapQVImages(p: any): ProductImage[] {
  const images: ProductImage[] = []
  if (p.thumbnail) {
    images.push({ id: "thumb-0", url: p.thumbnail, alt: p.title || "", type: "primary", order: 0 })
  }
  if (p.images) {
    p.images.forEach((img: any, idx: number) => {
      if (img.url === p.thumbnail && idx === 0) return
      images.push({ id: img.id || `img-${idx}`, url: img.url, alt: p.title || "", type: "gallery", order: images.length })
    })
  }
  return images
}

function mapQVVariants(p: any): ProductVariant[] {
  return (p.variants || []).map((v: any) => {
    const cp = v.calculated_price
    const price = (cp?.calculated_amount ?? 0) / 100
    const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
    const attrs: Record<string, string> = {}
    if (v.options) {
      for (const [key, val] of Object.entries(v.options)) attrs[key] = String(val)
    }
    return {
      id: v.id, attributes: attrs, sku: v.sku || "", price, mrp,
      inStock: v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0,
      stockCount: v.inventory_quantity ?? 999, colorSwatch: null,
    }
  })
}

function buildQVAttributes(p: any): VariantAttribute[] {
  if (!p.options || p.options.length === 0) return []
  if (
    (p.options.length === 1 && p.options[0].title?.toLowerCase() === "default") ||
    (p.variants?.length || 0) <= 1
  ) return []
  return p.options.map((opt: any) => {
    const vals = new Set<string>()
    for (const v of p.variants || []) {
      const val = v.options?.[opt.title]
      if (val) vals.add(String(val))
    }
    return { name: opt.title, label: opt.title, type: "dropdown" as const, values: Array.from(vals) }
  })
}

function mapQVProduct(p: any): Product {
  const v = p.variants?.[0]
  const cp = v?.calculated_price
  const price = (cp?.calculated_amount ?? 0) / 100
  const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
  const curr = (cp?.currency_code || "inr").toUpperCase()
  const meta = p.metadata || {}
  return {
    id: p.id, name: p.title, slug: p.handle, description: p.description || "",
    shortDescription: meta.short_description || (p.description || "").slice(0, 200),
    currency: curr === "USD" ? "USD" : "INR", price, mrp,
    discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0,
    rating: 0, reviewCount: 0,
    inStock: p.variants?.some((v: any) => v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0) ?? true,
    sku: v?.sku || p.handle || "", isNew: false,
    expressShipping: meta.express_shipping === "true",
    deliveryEstimate: meta.delivery_estimate || "3-5 business days",
    returnPolicy: meta.return_policy || "7-day easy returns",
  }
}

export default function HomePage() {
  const router = useRouter()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()

  const [isLoading, setIsLoading] = useState(true)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [categories, setCategories] = useState<CategoryCard[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<StorefrontProduct[]>([])
  const [newArrivals, setNewArrivals] = useState<StorefrontProduct[]>([])
  const [bestsellers, setBestsellers] = useState<StorefrontProduct[]>([])
  const [deals, setDeals] = useState<DealProduct[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [sectionConfig, setSectionConfig] = useState<HomepageSection[] | undefined>(undefined)

  // QuickView state
  const [qvOpen, setQvOpen] = useState(false)
  const [qvProduct, setQvProduct] = useState<Product | null>(null)
  const [qvImages, setQvImages] = useState<ProductImage[]>([])
  const [qvVariants, setQvVariants] = useState<ProductVariant[]>([])
  const [qvAttributes, setQvAttributes] = useState<VariantAttribute[]>([])

  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {
        "x-publishable-api-key":
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      }

      // First fetch region to get pricing context
      let regionId = ""
      try {
        const regRes = await fetch(`${BACKEND_URL}/store/regions`, { headers })
        const regData = await regRes.json()
        const inrRegion = regData.regions?.find((r: any) => r.currency_code === "inr")
        regionId = inrRegion?.id || regData.regions?.[0]?.id || ""
      } catch {}

      const productFields = "id,title,handle,thumbnail,created_at,metadata,variants.id,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,images.url"
      const regionParam = regionId ? `&region_id=${regionId}` : ""

      // Fetch all data in parallel
      const [
        heroRes,
        catRes,
        featuredRes,
        newRes,
        bestRes,
        testimonialsRes,
        storefrontRes,
      ] = await Promise.allSettled([
        // Hero slides from custom module
        fetch(`${BACKEND_URL}/store/hero-slides`, { headers }).then((r) => r.json()),
        // Categories from Medusa
        fetch(
          `${BACKEND_URL}/store/product-categories?limit=8&parent_category_id=null&include_descendants_tree=false`,
          { headers }
        ).then((r) => r.json()),
        // Featured products
        fetch(
          `${BACKEND_URL}/store/products?limit=10&fields=${productFields}${regionParam}`,
          { headers }
        ).then((r) => r.json()),
        // New arrivals (sorted by created_at desc)
        fetch(
          `${BACKEND_URL}/store/products?limit=10&order=-created_at&fields=${productFields}${regionParam}`,
          { headers }
        ).then((r) => r.json()),
        // Bestsellers
        fetch(
          `${BACKEND_URL}/store/products?limit=10&fields=${productFields}${regionParam}`,
          { headers }
        ).then((r) => r.json()),
        // Testimonials from custom module
        fetch(`${BACKEND_URL}/store/testimonials`, { headers }).then((r) => r.json()),
        // Storefront config for section ordering/visibility
        fetch(`${BACKEND_URL}/store/storefront-config`).then((r) => r.json()),
      ])

      if (heroRes.status === "fulfilled") {
        setHeroSlides(heroRes.value.hero_slides || [])
      }

      if (catRes.status === "fulfilled") {
        setCategories(
          (catRes.value.product_categories || []).map(mapMedusaCategory)
        )
      }

      if (featuredRes.status === "fulfilled") {
        const products = (featuredRes.value.products || []).map(mapMedusaProduct)
        setFeaturedProducts(products)
      }

      if (newRes.status === "fulfilled") {
        const products = (newRes.value.products || []).map(mapMedusaProduct)
        setNewArrivals(products)
      }

      if (bestRes.status === "fulfilled") {
        const products = (bestRes.value.products || []).map(mapMedusaProduct)
        // If no tagged bestsellers, use featured or all products
        setBestsellers(
          products.length > 0
            ? products
            : featuredRes.status === "fulfilled"
            ? (featuredRes.value.products || []).map(mapMedusaProduct)
            : []
        )
      }

      if (testimonialsRes.status === "fulfilled") {
        setTestimonials(testimonialsRes.value.testimonials || [])
      }

      if (storefrontRes.status === "fulfilled") {
        const sections = storefrontRes.value.config?.homepageSections
        if (sections?.length) setSectionConfig(sections)
      }

      // Deals: products with metadata.deal_expires_at in the future
      // Re-use featured products for now; filter those with deal metadata
      if (featuredRes.status === "fulfilled") {
        const allProducts = featuredRes.value.products || []
        const dealProducts: DealProduct[] = allProducts
          .filter(
            (p: any) =>
              p.metadata?.deal_expires_at &&
              new Date(p.metadata.deal_expires_at) > new Date()
          )
          .map((p: any) => {
            const mapped = mapMedusaProduct(p)
            return {
              ...mapped,
              discountPercent: mapped.mrp > mapped.price
                ? Math.round(
                    ((mapped.mrp - mapped.price) / mapped.mrp) * 100
                  )
                : Number(p.metadata?.deal_discount_percent || 0),
              expiresAt: p.metadata.deal_expires_at,
            }
          })
        setDeals(dealProducts)
      }
    } catch (err) {
      console.error("Failed to fetch homepage data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddToCart = async (productId: string) => {
    try {
      // Fetch product to get first variant
      const res = await fetch(
        `${BACKEND_URL}/store/products/${productId}?fields=variants.id`,
        {
          headers: {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
        }
      )
      const data = await res.json()
      const variantId = data.product?.variants?.[0]?.id
      if (variantId) {
        await addItem(variantId, 1)
      }
    } catch (err) {
      console.error("Add to cart failed:", err)
    }
  }

  const handleToggleWishlist = async (productId: string) => {
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId, "")
      } else {
        await addToWishlist(productId, "")
      }
    } catch (err) {
      console.error("Wishlist toggle failed:", err)
    }
  }

  const handleQuickView = async (productId: string) => {
    try {
      const qvHeaders: Record<string, string> = {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      }
      // Fetch region for pricing
      let regionId = ""
      try {
        const regRes = await fetch(`${BACKEND_URL}/store/regions`, { headers: qvHeaders })
        const regData = await regRes.json()
        const inrRegion = regData.regions?.find((r: any) => r.currency_code === "inr")
        regionId = inrRegion?.id || regData.regions?.[0]?.id || ""
      } catch {}
      const regionParam = regionId ? `&region_id=${regionId}` : ""
      const fields = "id,title,handle,thumbnail,description,metadata,created_at,options.title,variants.id,variants.sku,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,variants.options,images.id,images.url"
      const res = await fetch(`${BACKEND_URL}/store/products/${productId}?fields=${fields}${regionParam}`, { headers: qvHeaders })
      const data = await res.json()
      const p = data.product
      if (!p) return

      setQvProduct(mapQVProduct(p))
      setQvImages(mapQVImages(p))
      setQvVariants(mapQVVariants(p))
      setQvAttributes(buildQVAttributes(p))
      setQvOpen(true)
    } catch (err) {
      console.error("Quick view fetch failed:", err)
      // Fallback: navigate to product page
      router.push(`/product/${productId}`)
    }
  }

  const handleQvAddToCart = async (variantId: string, quantity: number) => {
    try {
      await addItem(variantId, quantity)
      setQvOpen(false)
    } catch (err) {
      console.error("QV add to cart failed:", err)
    }
  }

  const handleNewsletterSubscribe = async (email: string) => {
    await fetch(`${BACKEND_URL}/store/newsletter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      body: JSON.stringify({ email }),
    })
  }

  if (isLoading) {
    return <HomepageSkeleton />
  }

  return (
    <>
      <Homepage
        heroSlides={heroSlides}
        categories={categories}
        featuredProducts={featuredProducts}
        newArrivals={newArrivals}
        bestsellers={bestsellers}
        deals={deals}
        testimonials={testimonials}
        trustBadges={TRUST_BADGES}
        sectionConfig={sectionConfig}
        onHeroCtaClick={(link) => router.push(link)}
        onCategoryClick={(slug) => router.push(`/category/${slug}`)}
        onProductClick={(slug) => router.push(`/product/${slug}`)}
        onQuickView={handleQuickView}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onNewsletterSubscribe={handleNewsletterSubscribe}
        isWishlisted={isInWishlist}
      />
      {qvProduct && (
        <QuickViewModal
          product={qvProduct}
          images={qvImages}
          variants={qvVariants}
          variantAttributes={qvAttributes}
          isOpen={qvOpen}
          onClose={() => setQvOpen(false)}
          onAddToCart={handleQvAddToCart}
          onViewFullDetails={(slug) => {
            setQvOpen(false)
            router.push(`/product/${slug}`)
          }}
        />
      )}
    </>
  )
}
