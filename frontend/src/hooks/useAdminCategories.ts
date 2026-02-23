"use client"

import { useCallback } from "react"
import { medusa, adminFetch as libAdminFetch } from "@/lib/medusa"
import { normalizeImageUrl } from "@/lib/image-url"
import type { Category, CategoryOption, CategoryGoogleMerchant } from "@/types/admin-category"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAdminToken(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem("vastucart_admin_token") || localStorage.getItem("medusa_auth_token") || ""
}

const EMPTY_GOOGLE_MERCHANT: CategoryGoogleMerchant = {
  googleProductCategory: "",
  customLabel0: "",
  customLabel1: "",
  customLabel2: "",
  customLabel3: "",
  customLabel4: "",
}

// ---------------------------------------------------------------------------
// Data Mappers: Medusa → UI types
// ---------------------------------------------------------------------------

function mapMedusaCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name || "",
    slug: c.handle || "",
    description: c.description || "",
    imageUrl: normalizeImageUrl(c.metadata?.image_url || ""),
    parentId: c.parent_category?.id || null,
    parentName: c.parent_category?.name || null,
    status: c.is_active ? "active" : "inactive",
    displayOrder: c.rank ?? 0,
    productCount: 0, // injected separately by page
    children: (c.category_children || []).map(mapMedusaCategory),
    seo: {
      metaTitle: c.metadata?.seo_title || "",
      metaDescription: c.metadata?.seo_description || "",
    },
    googleMerchant: {
      googleProductCategory: c.metadata?.google_product_category || "",
      customLabel0: c.metadata?.custom_label_0 || "",
      customLabel1: c.metadata?.custom_label_1 || "",
      customLabel2: c.metadata?.custom_label_2 || "",
      customLabel3: c.metadata?.custom_label_3 || "",
      customLabel4: c.metadata?.custom_label_4 || "",
    },
    createdAt: c.created_at || "",
    updatedAt: c.updated_at || "",
  }
}

/**
 * Build a depth-first tree from a flat list using parent relationships.
 * Medusa returns categories flat (each with a parent_category reference).
 */
function buildTree(flat: Category[]): Category[] {
  const byId: Record<string, Category> = {}
  for (const cat of flat) {
    byId[cat.id] = { ...cat, children: [] }
  }
  const roots: Category[] = []
  for (const cat of flat) {
    if (cat.parentId && byId[cat.parentId]) {
      byId[cat.parentId].children.push(byId[cat.id])
    } else {
      roots.push(byId[cat.id])
    }
  }
  // Sort by displayOrder within each level
  const sortLevel = (cats: Category[]) => {
    cats.sort((a, b) => a.displayOrder - b.displayOrder)
    cats.forEach((c) => sortLevel(c.children))
  }
  sortLevel(roots)
  return roots
}

/**
 * Flatten tree to a depth-aware list for parent dropdowns.
 * Excludes the category being edited (to prevent circular parenting).
 */
function buildParentOptions(
  cats: Category[],
  excludeId?: string,
  depth = 0
): CategoryOption[] {
  const result: CategoryOption[] = []
  for (const cat of cats) {
    if (cat.id === excludeId) continue
    result.push({ id: cat.id, name: cat.name, depth })
    result.push(...buildParentOptions(cat.children || [], excludeId, depth + 1))
  }
  return result
}

// ---------------------------------------------------------------------------
// API Payload Builder: UI → Medusa
// ---------------------------------------------------------------------------

function buildCategoryPayload(data: Partial<Category>): any {
  const payload: any = {}

  if (data.name !== undefined) payload.name = data.name
  if (data.description !== undefined) payload.description = data.description
  if (data.slug !== undefined) payload.handle = data.slug
  if (data.status !== undefined) payload.is_active = data.status === "active"
  if (data.displayOrder !== undefined) payload.rank = data.displayOrder
  if ("parentId" in data) payload.parent_category_id = data.parentId || null

  const metadata: Record<string, any> = {}
  if (data.imageUrl !== undefined) metadata.image_url = data.imageUrl
  if (data.seo?.metaTitle !== undefined) metadata.seo_title = data.seo.metaTitle
  if (data.seo?.metaDescription !== undefined) metadata.seo_description = data.seo.metaDescription
  if (data.googleMerchant) {
    if (data.googleMerchant.googleProductCategory)
      metadata.google_product_category = data.googleMerchant.googleProductCategory
    if (data.googleMerchant.customLabel0) metadata.custom_label_0 = data.googleMerchant.customLabel0
    if (data.googleMerchant.customLabel1) metadata.custom_label_1 = data.googleMerchant.customLabel1
    if (data.googleMerchant.customLabel2) metadata.custom_label_2 = data.googleMerchant.customLabel2
    if (data.googleMerchant.customLabel3) metadata.custom_label_3 = data.googleMerchant.customLabel3
    if (data.googleMerchant.customLabel4) metadata.custom_label_4 = data.googleMerchant.customLabel4
  }
  if (Object.keys(metadata).length > 0) payload.metadata = metadata

  return payload
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminCategories() {
  const adminFetch = useCallback(async (path: string, options?: { method?: string; body?: unknown }) => {
    return libAdminFetch(path, options)
  }, [])

  /**
   * Fetch all categories from Medusa as a flat list, then build a tree.
   * Also returns parentOptions (flat, depth-aware) for dropdowns.
   */
  const fetchCategoryTree = useCallback(async (): Promise<{
    tree: Category[]
    flatList: Category[]
    parentOptions: CategoryOption[]
  }> => {
    try {
      const res = await adminFetch(
        "/admin/product-categories?limit=100&fields=id,name,handle,description,is_active,rank,created_at,updated_at,metadata,*parent_category"
      )
      const flatList: Category[] = (res.product_categories || []).map(mapMedusaCategory)
      const tree = buildTree(flatList)
      const parentOptions = buildParentOptions(tree)
      return { tree, flatList, parentOptions }
    } catch {
      return { tree: [], flatList: [], parentOptions: [] }
    }
  }, [adminFetch])

  /**
   * Fetch product counts per category.
   * Returns Record<categoryId, count>.
   */
  const fetchProductCounts = useCallback(async (): Promise<Record<string, number>> => {
    try {
      const res = await adminFetch(
        "/admin/products?fields=id,*categories&limit=1000&offset=0"
      )
      const products: any[] = res.products || []
      const counts: Record<string, number> = {}
      for (const p of products) {
        for (const cat of p.categories || []) {
          counts[cat.id] = (counts[cat.id] || 0) + 1
        }
      }
      return counts
    } catch {
      return {}
    }
  }, [adminFetch])

  /**
   * Fetch all products belonging to a specific category (for reassignment modal).
   */
  const fetchProductsInCategory = useCallback(
    async (categoryId: string): Promise<Array<{ id: string; title: string; categories: string[] }>> => {
      try {
        const res = await adminFetch(
          `/admin/products?category_id[]=${categoryId}&fields=id,title,*categories&limit=200`
        )
        return (res.products || []).map((p: any) => ({
          id: p.id,
          title: p.title || "",
          categories: (p.categories || []).map((c: any) => c.id),
        }))
      } catch {
        return []
      }
    },
    [adminFetch]
  )

  const createCategory = useCallback(
    async (data: Partial<Category>): Promise<Category | null> => {
      try {
        const payload = buildCategoryPayload(data)
        const res = await adminFetch("/admin/product-categories", {
          method: "POST",
          body: payload,
        })
        if (!res.product_category) return null
        return mapMedusaCategory(res.product_category)
      } catch (err) {
        console.error("createCategory error:", err)
        return null
      }
    },
    [adminFetch]
  )

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>): Promise<Category | null> => {
      try {
        const payload = buildCategoryPayload(data)
        const res = await adminFetch(`/admin/product-categories/${id}`, {
          method: "POST",
          body: payload,
        })
        if (!res.product_category) return null
        return mapMedusaCategory(res.product_category)
      } catch (err) {
        console.error("updateCategory error:", err)
        return null
      }
    },
    [adminFetch]
  )

  /**
   * Delete a category. If reassignToId is provided, first moves all products
   * from the deleted category to the target category (multi-category support).
   */
  const deleteCategory = useCallback(
    async (id: string, reassignToId?: string): Promise<boolean> => {
      try {
        // Step 1: Reassign products if needed
        if (reassignToId) {
          const products = await fetchProductsInCategory(id)
          await Promise.all(
            products.map(async (p) => {
              // Remove deleted cat, add reassignment cat (dedup)
              const updatedCatIds = Array.from(
                new Set([...p.categories.filter((cid) => cid !== id), reassignToId])
              )
              await adminFetch(`/admin/products/${p.id}`, {
                method: "POST",
                body: {
                  categories: updatedCatIds.map((cid) => ({ id: cid })),
                },
              })
            })
          )
        }

        // Step 2: Delete the category
        await adminFetch(`/admin/product-categories/${id}`, { method: "DELETE" })
        return true
      } catch (err) {
        console.error("deleteCategory error:", err)
        return false
      }
    },
    [adminFetch, fetchProductsInCategory]
  )

  const toggleStatus = useCallback(
    async (id: string, currentlyActive: boolean): Promise<Category | null> => {
      try {
        const res = await adminFetch(`/admin/product-categories/${id}`, {
          method: "POST",
          body: { is_active: !currentlyActive },
        })
        if (!res.product_category) return null
        return mapMedusaCategory(res.product_category)
      } catch (err) {
        console.error("toggleStatus error:", err)
        return null
      }
    },
    [adminFetch]
  )

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)

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
    fetchCategoryTree,
    fetchProductCounts,
    fetchProductsInCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleStatus,
    uploadFile,
    buildParentOptions,
  }
}
