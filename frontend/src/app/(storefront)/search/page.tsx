"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CategoryListing } from "@/components/storefront/CategoryListing"
import { useWishlist } from "@/providers/wishlist-provider"
import { useCart } from "@/providers/cart-provider"
import { useAuth } from "@/providers/auth-provider"
import type {
  StorefrontProduct,
  CategoryHero,
  FilterGroup,
  SortOption,
  Breadcrumb,
} from "@/types/storefront"
import { bg, primary, earth, fonts } from "@/lib/theme"
import { getRegionId } from "@/lib/region"
import { FALLBACK_HERO } from "@/lib/image-constants"
import { normalizeImageUrl } from "@/lib/image-url"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

const SORT_OPTIONS: SortOption[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Newest First", value: "newest" },
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
    isNew: !!p.metadata?.is_new,
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

function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""

  const { user } = useAuth()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addItem } = useCart()

  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<StorefrontProduct[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  const currentPage = Number(searchParams.get("page")) || 1
  const currentSort = searchParams.get("sort") || "relevance"
  const limit = 20

  const searchProducts = useCallback(async () => {
    if (!query) {
      setProducts([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const headers: Record<string, string> = {
      "x-publishable-api-key":
        process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
    }

    try {
      const regionId = await getRegionId()
      const regionParam = regionId ? `&region_id=${regionId}` : ""
      const offset = (currentPage - 1) * limit
      const sortParam = getSortParams(currentSort)
      const res = await fetch(
        `${BACKEND_URL}/store/products?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}${sortParam}&fields=id,title,handle,thumbnail,created_at,metadata,variants.id,variants.calculated_price,variants.manage_inventory,variants.inventory_quantity,images.url${regionParam}`,
        { headers }
      )
      const data = await res.json()
      const mapped = (data.products || []).map(mapProduct)
      setProducts(mapped)
      setTotalCount(data.count || mapped.length)
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setIsLoading(false)
    }
  }, [query, currentPage, currentSort])

  useEffect(() => {
    searchProducts()
  }, [searchProducts])

  const categoryHero: CategoryHero = {
    name: query ? `Search: "${query}"` : "Search",
    description: query
      ? `Showing results for "${query}"`
      : "Enter a search term to find products",
    imageUrl: FALLBACK_HERO,
    slug: "search",
    productCount: totalCount,
  }

  const breadcrumbs: Breadcrumb[] = [
    { label: "Home", href: "/" },
    { label: `Search: "${query}"`, href: null },
  ]

  const totalPages = Math.ceil(totalCount / limit)

  const updateUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v) sp.set(k, v)
      else sp.delete(k)
    })
    router.push(`/search?${sp.toString()}`)
  }

  const handleAddToCart = async (productId: string) => {
    try {
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
      if (variantId) await addItem(variantId, 1)
    } catch {}
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
    }
  }

  // No results state
  if (!isLoading && query && products.length === 0) {
    return (
      <div style={{ background: bg.primary, minHeight: "70vh" }}>
        {/* Hero banner */}
        <section className="relative overflow-hidden" style={{ minHeight: 220 }}>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${categoryHero.imageUrl})`,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(1,63,71,0.92) 0%, rgba(1,63,71,0.7) 50%, rgba(1,63,71,0.45) 100%)",
            }}
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: fonts.heading }}
            >
              No results for &ldquo;{query}&rdquo;
            </h1>
          </div>
        </section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: earth[700], fontFamily: fonts.heading }}
          >
            We couldn&apos;t find any products matching your search.
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: earth[400], fontFamily: fonts.body }}
          >
            Try different keywords, check your spelling, or browse our categories.
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

  return (
    <CategoryListing
      categoryHero={categoryHero}
      breadcrumbs={breadcrumbs}
      products={products}
      totalCount={totalCount}
      currentPage={currentPage}
      totalPages={totalPages}
      filterGroups={[]}
      activeFilters={activeFilters}
      sortOptions={SORT_OPTIONS}
      currentSort={currentSort}
      isLoading={isLoading}
      onProductClick={(s) => router.push(`/product/${s}`)}
      onQuickView={(id) => router.push(`/product/${id}`)}
      onAddToCart={handleAddToCart}
      onToggleWishlist={handleToggleWishlist}
      onFilterChange={(filterId, values) => {
        setActiveFilters((prev) => ({ ...prev, [filterId]: values }))
      }}
      onPriceRangeChange={() => {}}
      onClearFilters={() => setActiveFilters({})}
      onSortChange={(sort) => updateUrl({ sort, page: "1" })}
      onPageChange={(page) => updateUrl({ page: String(page) })}
      isWishlisted={isInWishlist}
    />
  )
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  )
}
