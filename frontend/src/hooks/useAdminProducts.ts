"use client"

import { useCallback } from "react"
import { medusa } from "@/lib/medusa"
import type {
  Product,
  ProductDetail,
  ProductVariant,
  ProductImage,
  ProductFilters,
  CategoryOption,
  StockLevel,
} from "@/types/admin-product"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function computeStockLevel(stock: number): StockLevel {
  if (stock === 0) return "out_of_stock"
  if (stock < 2) return "low_stock"
  return "in_stock"
}

function getAdminToken(): string {
  // Medusa v2 stores admin JWT in a cookie named "medusa_admin_jwt" or similar
  // The medusa SDK client handles this automatically; for native fetch we read cookies
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(/(?:^|;\s*)medusa_admin_jwt=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ""
}

// ---------------------------------------------------------------------------
// Data Mappers: Medusa → UI types
// ---------------------------------------------------------------------------

function mapMedusaProduct(p: any): Product {
  // Derive UI status
  let status: Product["status"] = "draft"
  if (p.metadata?.ui_status === "inactive") {
    status = "inactive"
  } else if (p.status === "published") {
    status = "active"
  }

  // Collect INR prices across variants
  const inrPrices: number[] = []
  for (const v of p.variants || []) {
    for (const price of v.prices || []) {
      if (price.currency_code === "inr") inrPrices.push(price.amount)
    }
  }
  const minInrAmount = inrPrices.length > 0 ? Math.min(...inrPrices) : 0
  const price = minInrAmount / 100

  const mrp =
    p.metadata?.mrp_inr != null ? p.metadata.mrp_inr / 100 : price

  const stock = (p.variants || []).reduce(
    (sum: number, v: any) => sum + (v.inventory_quantity || 0),
    0
  )

  return {
    id: p.id,
    name: p.title || "",
    sku: p.variants?.[0]?.sku || "",
    category: p.categories?.[0]?.name || "",
    categoryId: p.categories?.[0]?.id || "",
    status,
    price,
    mrp,
    currency: "INR",
    stock,
    stockLevel: computeStockLevel(stock),
    imageUrl: p.thumbnail || p.images?.[0]?.url || "",
    rating: p.metadata?.rating || 0,
    reviewCount: p.metadata?.review_count || 0,
    variantCount: p.variants?.length || 0,
    createdAt: p.created_at || "",
    updatedAt: p.updated_at || "",
  }
}

function mapMedusaProductDetail(p: any): ProductDetail {
  const base = mapMedusaProduct(p)

  const variants: ProductVariant[] = (p.variants || []).map((v: any) => {
    const inrPrice = v.prices?.find((pr: any) => pr.currency_code === "inr")
    const usdPrice = v.prices?.find((pr: any) => pr.currency_code === "usd")
    const stock = v.inventory_quantity || 0
    return {
      id: v.id,
      sku: v.sku || "",
      label: v.title || "",
      price: inrPrice ? inrPrice.amount / 100 : 0,
      mrp: v.metadata?.mrp_inr != null ? v.metadata.mrp_inr / 100 : 0,
      priceUSD: usdPrice ? usdPrice.amount / 100 : 0,
      mrpUSD: v.metadata?.mrp_usd != null ? v.metadata.mrp_usd / 100 : 0,
      currency: "INR",
      stock,
      stockLevel: computeStockLevel(stock),
    }
  })

  const images: ProductImage[] = (p.images || []).map((img: any, idx: number) => ({
    id: img.id || `img-${idx}`,
    url: img.url || "",
    alt: img.metadata?.alt || "",
    isPrimary: idx === 0,
    sortOrder: idx + 1,
  }))

  return {
    ...base,
    description: p.description || "",
    shortDescription: p.subtitle || "",
    variants,
    images,
    richContent: p.metadata?.rich_content || [],
    specs: p.metadata?.specs || [],
    faqs: p.metadata?.faqs || [],
    seo: {
      metaTitle: p.metadata?.seo_title || "",
      metaDescription: p.metadata?.seo_description || "",
      urlSlug: p.handle || "",
      canonicalUrl: p.metadata?.canonical_url || "",
    },
    merchantCentre: p.metadata?.merchant_centre || {
      gtin: "",
      mpn: "",
      brand: "",
      condition: "new",
      ageGroup: "",
      gender: "",
      googleCategory: "",
    },
    tags: (p.tags || []).map((t: any) => t.value || t),
    hsnCode: p.metadata?.hsn_code || "",
    gstRate: p.metadata?.gst_rate || 0,
  }
}

// ---------------------------------------------------------------------------
// Data Mapper: UI → Medusa API payload
// ---------------------------------------------------------------------------

function buildMedusaProductPayload(data: Partial<ProductDetail>): any {
  const medusaStatus =
    data.status === "active" ? "published" : "draft"

  const uiStatusMeta =
    data.status === "inactive" ? { ui_status: "inactive" } : {}

  const handle =
    data.seo?.urlSlug ||
    (data.name ? slugify(data.name) : undefined)

  const variants = (data.variants || []).map((v) => {
    const prices: Array<{ amount: number; currency_code: string }> = []
    if (v.price > 0) {
      prices.push({ amount: Math.round(v.price * 100), currency_code: "inr" })
    }
    if (v.priceUSD && v.priceUSD > 0) {
      prices.push({ amount: Math.round(v.priceUSD * 100), currency_code: "usd" })
    }

    const variantMeta: Record<string, number> = {}
    if (v.mrp > 0) variantMeta.mrp_inr = Math.round(v.mrp * 100)
    if (v.mrpUSD && v.mrpUSD > 0) variantMeta.mrp_usd = Math.round(v.mrpUSD * 100)

    const payload: any = {
      title: v.label || "Default",
      sku: v.sku || undefined,
      manage_inventory: true,
      inventory_quantity: v.stock || 0,
      prices,
    }
    if (Object.keys(variantMeta).length > 0) payload.metadata = variantMeta
    if (v.id && !v.id.startsWith("var-")) payload.id = v.id

    return payload
  })

  const metadata: Record<string, any> = {
    ...uiStatusMeta,
    ...(data.richContent && data.richContent.length > 0 ? { rich_content: data.richContent } : {}),
    ...(data.specs && data.specs.length > 0 ? { specs: data.specs } : {}),
    ...(data.faqs && data.faqs.length > 0 ? { faqs: data.faqs } : {}),
    ...(data.seo?.metaTitle ? { seo_title: data.seo.metaTitle } : {}),
    ...(data.seo?.metaDescription ? { seo_description: data.seo.metaDescription } : {}),
    ...(data.seo?.canonicalUrl ? { canonical_url: data.seo.canonicalUrl } : {}),
    ...(data.merchantCentre ? { merchant_centre: data.merchantCentre } : {}),
    ...(data.hsnCode ? { hsn_code: data.hsnCode } : {}),
    ...(data.gstRate != null && data.gstRate > 0 ? { gst_rate: data.gstRate } : {}),
  }

  const payload: any = {
    title: data.name || "",
    description: data.description || undefined,
    subtitle: data.shortDescription || undefined,
    status: medusaStatus,
    metadata,
  }

  if (handle) payload.handle = handle

  if (data.images && data.images.length > 0) {
    payload.thumbnail = data.images.find((img) => img.isPrimary)?.url || data.images[0]?.url
    payload.images = data.images.map((img) => ({ url: img.url }))
  }

  if (data.tags && data.tags.length > 0) {
    payload.tags = data.tags.filter(Boolean).map((t) => ({ value: t }))
  }

  if (data.categoryId) {
    payload.categories = [{ id: data.categoryId }]
  }

  if (variants.length > 0) payload.variants = variants

  return payload
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminProducts() {
  const adminFetch = useCallback(
    async (path: string, options?: RequestInit) => {
      const res = await (medusa.client.fetch as any)(path, options)
      return res
    },
    []
  )

  const fetchProducts = useCallback(
    async (
      filters: Partial<ProductFilters> = {},
      limit = 50,
      offset = 0
    ): Promise<{ products: Product[]; count: number }> => {
      const params = new URLSearchParams()
      params.set("limit", String(limit))
      params.set("offset", String(offset))
      params.set("fields", "id,title,subtitle,handle,status,thumbnail,created_at,updated_at,metadata,*variants,*images,*categories,*tags")

      if (filters.search) params.set("q", filters.search)

      if (filters.status && filters.status !== "all") {
        const medusaStatus = filters.status === "active" ? "published" : "draft"
        params.set("status[]", medusaStatus)
      }

      if (filters.category) params.set("category_id[]", filters.category)

      const res = await adminFetch(`/admin/products?${params}`)
      const products = (res.products || []).map(mapMedusaProduct)

      // Filter inactive via metadata (Medusa doesn't have native inactive)
      const filtered =
        filters.status === "inactive"
          ? products.filter((p: Product) => p.status === "inactive")
          : filters.status && filters.status !== "all"
            ? products.filter((p: Product) => p.status === filters.status)
            : products

      // Filter by stock level client-side
      const stockFiltered =
        filters.stockLevel && filters.stockLevel !== "all"
          ? filtered.filter((p: Product) => p.stockLevel === filters.stockLevel)
          : filtered

      return { products: stockFiltered, count: res.count || stockFiltered.length }
    },
    [adminFetch]
  )

  const fetchProductDetail = useCallback(
    async (id: string): Promise<ProductDetail | null> => {
      try {
        const res = await adminFetch(
          `/admin/products/${id}?fields=id,title,subtitle,description,handle,status,thumbnail,created_at,updated_at,metadata,*variants,*images,*categories,*tags`
        )
        if (!res.product) return null
        return mapMedusaProductDetail(res.product)
      } catch {
        return null
      }
    },
    [adminFetch]
  )

  const fetchCategories = useCallback(async (): Promise<CategoryOption[]> => {
    try {
      const res = await adminFetch("/admin/product-categories?limit=100&fields=id,name,parent_category")
      return (res.product_categories || []).map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        parentName: cat.parent_category?.name || null,
      }))
    } catch {
      return []
    }
  }, [adminFetch])

  const createProduct = useCallback(
    async (data: Partial<ProductDetail>): Promise<Product | null> => {
      try {
        const payload = buildMedusaProductPayload(data)
        const res = await adminFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })
        if (!res.product) return null
        return mapMedusaProduct(res.product)
      } catch (err) {
        console.error("createProduct error:", err)
        return null
      }
    },
    [adminFetch]
  )

  const updateProduct = useCallback(
    async (id: string, data: Partial<ProductDetail>): Promise<Product | null> => {
      try {
        const payload = buildMedusaProductPayload(data)
        const res = await adminFetch(`/admin/products/${id}`, {
          method: "POST",
          body: JSON.stringify(payload),
        })
        if (!res.product) return null
        return mapMedusaProduct(res.product)
      } catch (err) {
        console.error("updateProduct error:", err)
        return null
      }
    },
    [adminFetch]
  )

  const deleteProduct = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/products/${id}`, { method: "DELETE" })
        return true
      } catch {
        return false
      }
    },
    [adminFetch]
  )

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)

    // Use native fetch for FormData — medusa SDK may override Content-Type
    const token = getAdminToken()
    const headers: HeadersInit = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/admin/uploads`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.files?.[0]?.url || ""
  }, [])

  return {
    fetchProducts,
    fetchProductDetail,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadFile,
  }
}
