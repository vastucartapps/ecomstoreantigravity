"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminProductManagement } from "@/components/admin/products"
import { useAdminProducts } from "@/hooks/useAdminProducts"
import type {
  Product,
  ProductDetail,
  ProductFilters,
  ViewMode,
  CategoryOption,
  BulkAction,
} from "@/types/admin-product"

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  status: "all",
  category: "",
  stockLevel: "all",
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchProducts,
    fetchProductDetail,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadFile,
  } = useAdminProducts()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadProducts = useCallback(
    async (f: ProductFilters) => {
      setIsLoading(true)
      try {
        const result = await fetchProducts(f)
        setProducts(result.products)
        setTotalCount(result.count)
      } catch {
        // keep existing list on error
      } finally {
        setIsLoading(false)
      }
    },
    [fetchProducts]
  )

  // Initial load
  useEffect(() => {
    fetchCategories().then(setCategories)
    loadProducts(DEFAULT_FILTERS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChangeFilters = useCallback(
    (partial: Partial<ProductFilters>) => {
      const next = { ...filters, ...partial }
      setFilters(next)
      loadProducts(next)
    },
    [filters, loadProducts]
  )

  const handleSearch = useCallback(
    (query: string) => {
      handleChangeFilters({ search: query })
    },
    [handleChangeFilters]
  )

  // Called when user clicks "Add Product" — clear any existing editing state
  const handleAddProduct = useCallback(() => {
    setEditingProduct(null)
  }, [])

  // Called when user clicks "Edit" on a product row/card
  const handleEditProduct = useCallback(
    async (id: string) => {
      try {
        const detail = await fetchProductDetail(id)
        setEditingProduct(detail)
      } catch {
        showToast("Failed to load product details")
      }
    },
    [fetchProductDetail, showToast]
  )

  // Called when user clicks "Duplicate" — fetch, clear identifiers, add "(Copy)"
  const handleDuplicateProduct = useCallback(
    async (id: string) => {
      try {
        const detail = await fetchProductDetail(id)
        if (!detail) return
        setEditingProduct({
          ...detail,
          id: "",
          name: `${detail.name} (Copy)`,
          sku: "",
          seo: { ...detail.seo, urlSlug: "" },
          variants: detail.variants.map((v) => ({
            ...v,
            id: `var-new-${Math.random().toString(36).slice(2)}`,
            sku: "",
          })),
        })
      } catch {
        showToast("Failed to duplicate product")
      }
    },
    [fetchProductDetail, showToast]
  )

  const handleDeleteProduct = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this product? This cannot be undone.")) return
      const ok = await deleteProduct(id)
      if (ok) {
        loadProducts(filters)
      } else {
        showToast("Failed to delete product")
      }
    },
    [deleteProduct, filters, loadProducts, showToast]
  )

  const handleBulkAction = useCallback(
    async (action: BulkAction, ids: string[]) => {
      if (action === "export") {
        showToast("CSV export coming soon")
        return
      }
      if (action === "activate") {
        await Promise.all(
          ids.map((id) => updateProduct(id, { status: "active" } as Partial<ProductDetail>))
        )
        loadProducts(filters)
        showToast(`Activated ${ids.length} product(s)`)
        return
      }
      if (action === "deactivate") {
        await Promise.all(
          ids.map((id) => updateProduct(id, { status: "inactive" } as Partial<ProductDetail>))
        )
        loadProducts(filters)
        showToast(`Deactivated ${ids.length} product(s)`)
        return
      }
      if (action === "delete") {
        if (!window.confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return
        await Promise.all(ids.map((id) => deleteProduct(id)))
        loadProducts(filters)
        showToast(`Deleted ${ids.length} product(s)`)
      }
    },
    [updateProduct, deleteProduct, filters, loadProducts, showToast]
  )

  const handleSaveDraft = useCallback(
    async (data: Partial<ProductDetail>) => {
      const payload: Partial<ProductDetail> = { ...data, status: "draft" }
      let ok: Product | null
      try {
        if (editingProduct?.id) {
          ok = await updateProduct(editingProduct.id, payload)
        } else {
          ok = await createProduct(payload)
        }
      } catch (err: any) {
        // Surface the real backend message (e.g. "handle already taken",
        // "invalid SKU", "missing required field") instead of a generic
        // toast — the admin needs to know which field to fix.
        showToast(err?.message || "Failed to save draft")
        throw err
      }
      if (ok) {
        setEditingProduct(null)
        loadProducts(filters)
        showToast("Draft saved")
      } else {
        showToast("Failed to save draft")
        throw new Error("Save failed") // prevents wizard from closing on error
      }
    },
    [editingProduct, updateProduct, createProduct, filters, loadProducts, showToast]
  )

  const handlePublish = useCallback(
    async (data: Partial<ProductDetail>) => {
      const payload: Partial<ProductDetail> = { ...data, status: "active" }
      let ok: Product | null
      try {
        if (editingProduct?.id) {
          ok = await updateProduct(editingProduct.id, payload)
        } else {
          ok = await createProduct(payload)
        }
      } catch (err: any) {
        showToast(err?.message || "Failed to publish product")
        throw err
      }
      if (ok) {
        setEditingProduct(null)
        loadProducts(filters)
        showToast("Product published")
      } else {
        showToast("Failed to publish product")
        throw new Error("Publish failed") // prevents wizard from closing on error
      }
    },
    [editingProduct, updateProduct, createProduct, filters, loadProducts, showToast]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null)
  }, [])

  const handleUploadFile = useCallback(
    async (file: File): Promise<string> => {
      try {
        return await uploadFile(file)
      } catch {
        showToast("File upload failed")
        return ""
      }
    },
    [uploadFile, showToast]
  )

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white"
          style={{ background: "#013f47" }}
        >
          {toast}
        </div>
      )}

      <AdminProductManagement
        products={products}
        categories={categories}
        editingProduct={editingProduct}
        filters={filters}
        viewMode={viewMode}
        totalCount={totalCount}
        isLoading={isLoading}
        onChangeViewMode={setViewMode}
        onChangeFilters={handleChangeFilters}
        onSearch={handleSearch}
        onAddProduct={handleAddProduct}
        onEditProduct={handleEditProduct}
        onDuplicateProduct={handleDuplicateProduct}
        onDeleteProduct={handleDeleteProduct}
        onBulkAction={handleBulkAction}
        onImportCSV={() => showToast("CSV import coming soon")}
        onExportCSV={() => showToast("CSV export coming soon")}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onCancelEdit={handleCancelEdit}
        onUploadFile={handleUploadFile}
      />
    </>
  )
}
