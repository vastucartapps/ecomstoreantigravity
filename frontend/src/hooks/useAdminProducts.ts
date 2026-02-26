"use client"

import { useCallback } from "react"
import { medusa, adminFetch as libAdminFetch } from "@/lib/medusa"
import { normalizeImageUrl } from "@/lib/image-url"
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
  if (typeof window === "undefined") return ""
  return localStorage.getItem("vastucart_admin_token") || localStorage.getItem("medusa_auth_token") || ""
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
    // Try calculated_price first (available when region_id is provided)
    if (v.calculated_price?.calculated_amount != null) {
      inrPrices.push(v.calculated_price.calculated_amount)
      continue
    }
    // Fallback to raw prices array from admin API
    for (const price of v.prices || []) {
      if (price.currency_code === "inr") inrPrices.push(price.amount)
    }
  }
  const minInrAmount = inrPrices.length > 0 ? Math.min(...inrPrices) : 0
  const price = minInrAmount / 100

  // MRP: check variant-level metadata first, then product-level
  let mrp = price
  const variants = p.variants || []
  if (variants.length > 0 && variants[0].metadata?.mrp_inr != null) {
    mrp = variants[0].metadata.mrp_inr / 100
  } else if (p.metadata?.mrp_inr != null) {
    mrp = p.metadata.mrp_inr / 100
  }

  // Stock: if any variant has manage_inventory=false, treat as in-stock
  const hasUnmanagedInventory = variants.some(
    (v: any) => v.manage_inventory === false
  )
  const stock = hasUnmanagedInventory
    ? 999
    : variants.reduce(
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
    imageUrl: normalizeImageUrl(p.thumbnail || p.images?.[0]?.url || ""),
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
    // Price: try calculated_price first, then raw prices array
    let inrAmount = 0
    let usdAmount = 0
    if (v.calculated_price?.calculated_amount != null) {
      inrAmount = v.calculated_price.calculated_amount
    } else {
      const inrPrice = v.prices?.find((pr: any) => pr.currency_code === "inr")
      if (inrPrice) inrAmount = inrPrice.amount
    }
    const usdPrice = v.prices?.find((pr: any) => pr.currency_code === "usd")
    if (usdPrice) usdAmount = usdPrice.amount

    // Stock: treat manage_inventory=false as always in stock
    const stock = v.manage_inventory === false ? 999 : (v.inventory_quantity || 0)

    // Convert variant_details Record → array of {key,value} pairs for wizard
    const rawDetails = v.metadata?.variant_details as Record<string, string> | undefined
    const details: Array<{ key: string; value: string }> = rawDetails
      ? Object.entries(rawDetails).map(([key, value]) => ({ key, value }))
      : []

    return {
      id: v.id,
      sku: v.sku || "",
      label: v.title || "",
      price: inrAmount / 100,
      mrp: v.metadata?.mrp_inr != null ? v.metadata.mrp_inr / 100 : 0,
      priceUSD: usdAmount / 100,
      mrpUSD: v.metadata?.mrp_usd != null ? v.metadata.mrp_usd / 100 : 0,
      currency: "INR",
      stock,
      stockLevel: computeStockLevel(stock),
      details,
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
    variantImageMap: p.metadata?.variant_image_map || {},
  }
}

// ---------------------------------------------------------------------------
// Data Mapper: UI → Medusa API payload
// ---------------------------------------------------------------------------

/**
 * Build common product-level fields shared by create and update.
 */
function buildBasePayload(data: Partial<ProductDetail>): any {
  const medusaStatus =
    data.status === "active" ? "published" : "draft"

  const uiStatusMeta =
    data.status === "inactive" ? { ui_status: "inactive" } : {}

  const handle =
    data.seo?.urlSlug ||
    (data.name ? slugify(data.name) : undefined)

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
    ...(data.variantImageMap && Object.keys(data.variantImageMap).length > 0
      ? { variant_image_map: data.variantImageMap }
      : {}),
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

  // Tags are resolved to IDs inside createProduct/updateProduct (async required)
  // Store raw tag values temporarily for the caller to resolve
  if (data.tags && data.tags.length > 0) {
    payload._rawTags = data.tags.filter(Boolean)
  }

  if (data.categoryId) {
    payload.categories = [{ id: data.categoryId }]
  }

  return payload
}

/**
 * Build variant prices array from UI variant data.
 */
function buildVariantPrices(v: ProductVariant): Array<{ amount: number; currency_code: string }> {
  const prices: Array<{ amount: number; currency_code: string }> = []
  if (v.price > 0) {
    prices.push({ amount: Math.round(v.price * 100), currency_code: "inr" })
  }
  if (v.priceUSD && v.priceUSD > 0) {
    prices.push({ amount: Math.round(v.priceUSD * 100), currency_code: "usd" })
  }
  return prices
}

/**
 * Build variant metadata (MRP values stored as minor units, plus variant_details).
 */
function buildVariantMetadata(v: ProductVariant): Record<string, any> | undefined {
  const meta: Record<string, any> = {}
  if (v.mrp > 0) meta.mrp_inr = Math.round(v.mrp * 100)
  if (v.mrpUSD && v.mrpUSD > 0) meta.mrp_usd = Math.round(v.mrpUSD * 100)
  // Convert details array → Record, filtering blank keys
  if (v.details && v.details.length > 0) {
    const detailsRecord: Record<string, string> = {}
    for (const { key, value } of v.details) {
      if (key.trim()) detailsRecord[key.trim()] = value
    }
    if (Object.keys(detailsRecord).length > 0) meta.variant_details = detailsRecord
  }
  return Object.keys(meta).length > 0 ? meta : undefined
}

/**
 * Build payload for POST /admin/products (create).
 *
 * Medusa v2 requires:
 * - Product-level `options` array defining option names + all possible values
 * - Each variant must include an `options` map referencing those values
 * - manage_inventory: false (inventory items are managed separately via the
 *   inventory module; setting true without inventory items causes "Out of Stock")
 */
function buildCreatePayload(data: Partial<ProductDetail>): any {
  const payload = buildBasePayload(data)
  const uiVariants = data.variants || []

  if (uiVariants.length > 0) {
    // Collect all variant labels for the product-level options definition
    const variantLabels = uiVariants.map((v) => v.label || "Default")

    // Medusa v2 requires product-level options with all possible values
    payload.options = [{ title: "Variant", values: variantLabels }]

    // Build variant payloads with options map
    payload.variants = uiVariants.map((v) => {
      const label = v.label || "Default"
      const variantPayload: any = {
        title: label,
        options: { Variant: label },
        prices: buildVariantPrices(v),
        manage_inventory: false,
      }
      if (v.sku) variantPayload.sku = v.sku
      const meta = buildVariantMetadata(v)
      if (meta) variantPayload.metadata = meta
      return variantPayload
    })
  }

  return payload
}

/**
 * Build payload for POST /admin/products/:id (update).
 *
 * For existing variants (have real Medusa IDs): include ID to update in place.
 * For new variants (IDs starting with "var-" from the wizard): treated as new.
 * Product-level options are NOT resent on update to avoid breaking existing structure.
 */
function buildUpdatePayload(data: Partial<ProductDetail>): any {
  const payload = buildBasePayload(data)
  const uiVariants = data.variants || []

  if (uiVariants.length > 0) {
    payload.variants = uiVariants.map((v) => {
      const variantPayload: any = {
        title: v.label || "Default",
        prices: buildVariantPrices(v),
        manage_inventory: false,
      }
      if (v.sku) variantPayload.sku = v.sku
      const meta = buildVariantMetadata(v)
      if (meta) variantPayload.metadata = meta

      // Existing variant — include ID so Medusa updates it instead of creating new
      if (v.id && !v.id.startsWith("var-")) {
        variantPayload.id = v.id
      }
      return variantPayload
    })
  }

  return payload
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminProducts() {
  const adminFetch = useCallback(
    async (path: string, options?: { method?: string; body?: unknown }) => {
      return libAdminFetch(path, options)
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
      params.set("fields", "id,title,subtitle,handle,status,thumbnail,created_at,updated_at,metadata,*variants,*variants.prices,*images,*categories,*tags")

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
          `/admin/products/${id}?fields=id,title,subtitle,description,handle,status,thumbnail,created_at,updated_at,metadata,*variants,*variants.prices,*images,*categories,*tags`
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

  /**
   * Resolve raw tag values to Medusa tag IDs.
   * Creates any tags that don't exist yet via /admin/product-tags.
   */
  const resolveTags = useCallback(
    async (rawTags: string[]): Promise<Array<{ id: string }>> => {
      if (rawTags.length === 0) return []
      try {
        // Fetch ALL existing tags via pagination to prevent duplicate creation
        // when the store has more than any single page limit
        const allTags: Array<{ id: string; value: string }> = []
        const PAGE = 200
        let offset = 0
        while (true) {
          const res = await adminFetch(`/admin/product-tags?limit=${PAGE}&offset=${offset}&fields=id,value`)
          const page: Array<{ id: string; value: string }> = res.product_tags || []
          allTags.push(...page)
          if (page.length < PAGE) break
          offset += PAGE
        }
        const byValue = new Map(allTags.map((t) => [t.value.toLowerCase(), t.id]))

        const tagIds: Array<{ id: string }> = []
        for (const val of rawTags) {
          const lower = val.trim().toLowerCase()
          if (!lower) continue
          const existingId = byValue.get(lower)
          if (existingId) {
            tagIds.push({ id: existingId })
          } else {
            // Create the tag
            const createRes = await adminFetch("/admin/product-tags", {
              method: "POST",
              body: { value: val.trim() },
            })
            if (createRes.product_tag?.id) {
              tagIds.push({ id: createRes.product_tag.id })
              byValue.set(lower, createRes.product_tag.id)
            }
          }
        }
        return tagIds
      } catch (err) {
        console.error("resolveTags error:", err)
        return []
      }
    },
    [adminFetch]
  )

  const createProduct = useCallback(
    async (data: Partial<ProductDetail>): Promise<Product | null> => {
      try {
        const payload = buildCreatePayload(data)
        // Resolve tags from raw values to Medusa IDs
        if (payload._rawTags) {
          payload.tags = await resolveTags(payload._rawTags)
          delete payload._rawTags
        }
        const res = await adminFetch("/admin/products", {
          method: "POST",
          body: payload,
        })
        if (!res.product) return null
        return mapMedusaProduct(res.product)
      } catch (err) {
        console.error("createProduct error:", err)
        return null
      }
    },
    [adminFetch, resolveTags]
  )

  const updateProduct = useCallback(
    async (id: string, data: Partial<ProductDetail>): Promise<Product | null> => {
      try {
        const payload = buildUpdatePayload(data)
        // Resolve tags from raw values to Medusa IDs
        if (payload._rawTags) {
          payload.tags = await resolveTags(payload._rawTags)
          delete payload._rawTags
        }
        const res = await adminFetch(`/admin/products/${id}`, {
          method: "POST",
          body: payload,
        })
        if (!res.product) return null
        return mapMedusaProduct(res.product)
      } catch (err) {
        console.error("updateProduct error:", err)
        return null
      }
    },
    [adminFetch, resolveTags]
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
