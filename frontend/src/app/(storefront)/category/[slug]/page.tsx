"use client"

import { Suspense, useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CategoryListing } from "@/components/storefront/CategoryListing"
import { QuickViewModal } from "@/components/storefront/product-experience"
import { useWishlist } from "@/providers/wishlist-provider"
import { useCart } from "@/providers/cart-provider"
import { useAuth } from "@/providers/auth-provider"
import { useBranding } from "@/providers/announcement-provider"
import type {
  StorefrontProduct,
  CategoryHero,
  FilterGroup,
  SortOption,
  Breadcrumb,
} from "@/types/storefront"
import type {
  Product,
  ProductImage,
  ProductVariant,
  VariantAttribute,
} from "@/types/product-experience"
import { bg, primary, earth, fonts } from "@/lib/theme"
import { getRegionId } from "@/lib/region"
import { FALLBACK_HERO } from "@/lib/image-constants"
import { normalizeImageUrl } from "@/lib/image-url"
import { trackViewItemList, onceInSession } from "@/lib/analytics/events"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const SORT_OPTIONS: SortOption[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest First", value: "newest" },
]

const DEFAULT_FILTERS: FilterGroup[] = [
  {
    id: "filter-price",
    label: "Price Range",
    type: "range",
    min: 99,
    max: 50000,
    options: [],
  },
  {
    id: "filter-availability",
    label: "Availability",
    type: "toggle",
    min: 0,
    max: 0,
    options: [{ label: "In Stock Only", value: "in-stock", count: 0 }],
  },
]

function mapProduct(p: any): StorefrontProduct {
  const variant = p.variants?.[0]
  const cp = variant?.calculated_price
  const price = (cp?.calculated_amount ?? 0) / 100
  const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100

  return {
    id: p.id,
    name: p.title,
    slug: p.handle,
    imageUrl: normalizeImageUrl(p.thumbnail || p.images?.[0]?.url || ""),
    price,
    mrp,
    currency: (cp?.currency_code || "inr").toUpperCase() === "USD" ? "USD" : "INR",
    rating: p.metadata?.rating ? Number(p.metadata.rating) : 0,
    reviewCount: p.metadata?.review_count ? Number(p.metadata.review_count) : 0,
    variantCount: p.variants?.length || 1,
    isNew: !!p.metadata?.is_new || (p.created_at && (Date.now() - new Date(p.created_at).getTime()) / 86400000 <= 30),
    inStock: p.variants?.some((v: any) => v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0) ?? true,
  }
}

function getSortParams(sort: string): string {
  switch (sort) {
    case "price-asc":
      return "&order=variants.prices.amount"
    case "price-desc":
      return "&order=-variants.prices.amount"
    case "newest":
      return "&order=-created_at"
    default:
      return ""
  }
}

// Loading skeleton
function CategorySkeleton() {
  return (
    <div style={{ background: bg.primary, minHeight: "100vh" }}>
      <div
        className="animate-pulse"
        style={{ height: 220, background: primary[500], opacity: 0.3 }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-8">
          <div className="hidden lg:block w-64">
            <div
              className="h-96 rounded-xl animate-pulse"
              style={{ background: "#e8e0d8" }}
            />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <div
                  className="aspect-square rounded-t-xl animate-pulse"
                  style={{ background: "#e8e0d8" }}
                />
                <div className="p-3 space-y-2" style={{ background: "#fff" }}>
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
    </div>
  )
}

// ─── QuickView helpers ────────────────────────────────────

function mapQVImages(p: any): ProductImage[] {
  const images: ProductImage[] = []
  if (p.thumbnail) images.push({ id: "thumb-0", url: normalizeImageUrl(p.thumbnail), alt: p.title || "", type: "primary", order: 0 })
  if (p.images) p.images.forEach((img: any, idx: number) => {
    if (img.url === p.thumbnail && idx === 0) return
    images.push({ id: img.id || `img-${idx}`, url: normalizeImageUrl(img.url), alt: p.title || "", type: "gallery", order: images.length })
  })
  return images
}

function mapQVVariants(p: any): ProductVariant[] {
  // Medusa v2: build option_id → title lookup from product options
  const optionIdToTitle: Record<string, string> = {}
  for (const opt of p.options || []) optionIdToTitle[opt.id] = opt.title

  return (p.variants || []).map((v: any) => {
    const cp = v.calculated_price
    const price = (cp?.calculated_amount ?? 0) / 100
    const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
    // Medusa v2: variant.options is ARRAY of { id, value, option_id }
    const attrs: Record<string, string> = {}
    if (Array.isArray(v.options)) {
      for (const optVal of v.options) {
        attrs[optionIdToTitle[optVal.option_id] || "Variant"] = optVal.value
      }
    }
    if (Object.keys(attrs).length === 0 && v.title) {
      const fallbackTitle = p.options?.[0]?.title || "Variant"
      attrs[fallbackTitle] = v.title
    }
    return { id: v.id, attributes: attrs, sku: v.sku || "", price, mrp, inStock: v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0, stockCount: v.inventory_quantity ?? 999, colorSwatch: null }
  })
}

function buildQVAttributes(p: any): VariantAttribute[] {
  if (!p.options || p.options.length === 0) return []
  if ((p.options.length === 1 && p.options[0].title?.toLowerCase() === "default") || (p.variants?.length || 0) <= 1) return []
  return p.options.map((opt: any) => {
    const vals = new Set<string>()
    for (const v of p.variants || []) {
      // Medusa v2: variant.options is ARRAY of { id, value, option_id }
      if (Array.isArray(v.options)) {
        const match = v.options.find((o: any) => o.option_id === opt.id)
        if (match?.value) vals.add(String(match.value))
      }
    }
    if (vals.size === 0) {
      for (const v of p.variants || []) { if (v.title) vals.add(v.title) }
    }
    return { name: opt.title, label: opt.title, type: "dropdown" as const, values: Array.from(vals) }
  })
}

function mapQVProduct(p: any): Product {
  const v = p.variants?.[0]; const cp = v?.calculated_price
  const price = (cp?.calculated_amount ?? 0) / 100; const mrp = (cp?.original_amount ?? cp?.calculated_amount ?? 0) / 100
  const curr = (cp?.currency_code || "inr").toUpperCase(); const meta = p.metadata || {}
  return { id: p.id, name: p.title, slug: p.handle, description: p.description || "", shortDescription: meta.short_description || (p.description || "").slice(0, 200), currency: curr === "USD" ? "USD" : "INR", price, mrp, discountPercent: mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0, rating: 0, reviewCount: 0, inStock: p.variants?.some((v: any) => v.manage_inventory === false || (v.inventory_quantity ?? 1) > 0) ?? true, sku: v?.sku || p.handle || "", isNew: false, expressShipping: meta.express_shipping === "true", deliveryEstimate: meta.delivery_estimate || "", returnPolicy: meta.return_policy || "" }
}

function CategoryContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params?.slug as string

  const { user } = useAuth()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()
  const branding = useBranding()

  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<StorefrontProduct[]>([])

  // QuickView state
  const [qvOpen, setQvOpen] = useState(false)
  const [qvProduct, setQvProduct] = useState<Product | null>(null)
  const [qvImages, setQvImages] = useState<ProductImage[]>([])
  const [qvVariants, setQvVariants] = useState<ProductVariant[]>([])
  const [qvAttributes, setQvAttributes] = useState<VariantAttribute[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [categoryHero, setCategoryHero] = useState<CategoryHero>({
    name: "",
    description: "",
    imageUrl: "",
    slug: "",
    productCount: 0,
  })
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [priceRange, setPriceRange] = useState<[number, number]>([99, 50000])

  const currentPage = Number(searchParams.get("page")) || 1
  const currentSort = searchParams.get("sort") || "relevance"
  const limit = 20

  const fetchCategoryAndProducts = useCallback(async () => {
    setIsLoading(true)
    const headers: Record<string, string> = {
      "x-publishable-api-key":
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    }

    try {
      const regionId = await getRegionId()
      const regionParam = regionId ? `&region_id=${regionId}` : ""

      // Fetch category info
      const catRes = await fetch(
        `${BACKEND_URL}/store/product-categories?handle=${slug}&fields=id,name,handle,description,metadata`,
        { headers }
      )
      const catData = await catRes.json()
      const category = catData.product_categories?.[0]

      if (category) {
        setCategoryHero({
          name: category.name,
          description:
            category.description || `Browse our ${category.name} collection`,
          imageUrl:
            normalizeImageUrl(category.metadata?.image_url || "") ||
            FALLBACK_HERO,
          slug: category.handle,
          productCount: 0,
        })

        // Fetch products for this category
        const offset = (currentPage - 1) * limit
        const sortParam = getSortParams(currentSort)
        const prodRes = await fetch(
          `${BACKEND_URL}/store/products?category_id[]=${category.id}&limit=${limit}&offset=${offset}${sortParam}&fields=id,title,handle,thumbnail,created_at,metadata,variants.id,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,images.url${regionParam}`,
          { headers }
        )
        const prodData = await prodRes.json()

        const mappedProducts = (prodData.products || []).map(mapProduct)
        setProducts(mappedProducts)
        setTotalCount(prodData.count || mappedProducts.length)
        setCategoryHero((prev) => ({
          ...prev,
          productCount: prodData.count || mappedProducts.length,
        }))
        // GA4 view_item_list — one fire per category+page+sort combination
        const listKey = `list:category:${slug}:p${currentPage}:${currentSort}`
        onceInSession(listKey, () => {
          trackViewItemList({
            listId: `category:${slug}`,
            listName: `Category — ${decodeURIComponent(slug)}`,
            items: mappedProducts.slice(0, 20).map((p: StorefrontProduct) => ({
              item_id: p.id,
              item_name: p.name,
              price: p.price,
              quantity: 1,
              item_brand: branding.storeName,
            })),
          })
        })
      } else {
        setProducts([])
        setTotalCount(0)
        setCategoryHero({
          name: decodeURIComponent(slug).replace(/-/g, " "),
          description: "",
          imageUrl:
            FALLBACK_HERO,
          slug,
          productCount: 0,
        })
      }
    } catch (err) {
      console.error("Failed to fetch category:", err)
    } finally {
      setIsLoading(false)
    }
  }, [slug, currentPage, currentSort])

  useEffect(() => {
    fetchCategoryAndProducts()
  }, [fetchCategoryAndProducts])

  // Client-side filter applied to the fetched page of products
  const filteredProducts = useMemo(() => {
    let result = products
    if (priceRange[0] > 99 || priceRange[1] < 50000) {
      result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    }
    if (activeFilters["filter-availability"]?.includes("in-stock")) {
      result = result.filter((p) => p.inStock)
    }
    return result
  }, [products, priceRange, activeFilters])

  const breadcrumbs: Breadcrumb[] = [
    { label: "Home", href: "/" },
    { label: categoryHero.name || slug, href: null },
  ]

  const totalPages = Math.ceil(totalCount / limit)

  const updateUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
      else sp.delete(k)
    })
    router.push(`/category/${slug}?${sp.toString()}`)
  }

  const handleAddToCart = async (productId: string) => {
    try {
      const regionId = await getRegionId()
      const regionParam = regionId ? `&region_id=${regionId}` : ""
      const res = await fetch(
        `${BACKEND_URL}/store/products?id[]=${productId}&fields=id,variants.id${regionParam}`,
        {
          headers: {
            "x-publishable-api-key":
              process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
          },
        }
      )
      const data = await res.json()
      const variantId = data.products?.[0]?.variants?.[0]?.id
      if (variantId) await addItem(variantId, 1)
    } catch (err) {
      console.error("Add to cart failed:", err)
    }
  }

  const handleToggleWishlist = async (productId: string) => {
    if (!user) { router.push("/login"); return }
    try {
      if (isInWishlist(productId)) {
        await removeFromWishlist(productId, "")
      } else {
        await addToWishlist(productId, "")
      }
    } catch (err: any) {
      if (err?.message === "LOGIN_REQUIRED") { router.push("/login"); return }
      console.error("Wishlist toggle failed:", err)
    }
  }

  const handleQuickView = async (productId: string) => {
    try {
      const qvHeaders: Record<string, string> = { "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "" }
      const regionId = await getRegionId()
      const regionParam = regionId ? `&region_id=${regionId}` : ""
      const fields = "id,title,handle,thumbnail,description,metadata,created_at,options.title,variants.id,variants.sku,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,variants.options,images.id,images.url"
      const res = await fetch(`${BACKEND_URL}/store/products?id[]=${productId}&fields=${fields}${regionParam}`, { headers: qvHeaders })
      const data = await res.json()
      const p = data.products?.[0]
      if (!p) return
      setQvProduct(mapQVProduct(p))
      setQvImages(mapQVImages(p))
      setQvVariants(mapQVVariants(p))
      setQvAttributes(buildQVAttributes(p))
      setQvOpen(true)
    } catch (err) {
      console.error("Quick view fetch failed:", err)
      router.push(`/product/${productId}`)
    }
  }

  const handleQvAddToCart = async (variantId: string, quantity: number) => {
    try { await addItem(variantId, quantity); setQvOpen(false) } catch (err) { console.error("QV add to cart failed:", err) }
  }

  if (isLoading) return <CategorySkeleton />

  return (
    <>
    <CategoryListing
      categoryHero={categoryHero}
      breadcrumbs={breadcrumbs}
      products={filteredProducts}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={DEFAULT_FILTERS}
      activeFilters={activeFilters}
      sortOptions={SORT_OPTIONS}
      currentSort={currentSort}
      onProductClick={(s) => router.push(`/product/${s}`)}
      onQuickView={handleQuickView}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      onFilterChange={(filterId, values) => {
        setActiveFilters((prev) => ({ ...prev, [filterId]: values }))
      }}
      onPriceRangeChange={(min, max) => setPriceRange([min, max])}
      onClearFilters={() => {
        setActiveFilters({})
        setPriceRange([99, 50000])
        updateUrl({ page: "", sort: "" })
      }}
      onSortChange={(sort) => updateUrl({ sort, page: "1" })}
      onPageChange={(page) => updateUrl({ page: String(page) })}
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
        onViewFullDetails={(s) => { setQvOpen(false); router.push(`/product/${s}`) }}
      />
    )}
    </>
  )
}

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryContent />
    </Suspense>
  )
}
