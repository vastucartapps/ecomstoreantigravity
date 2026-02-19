"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminCategoryManagement } from "@/components/admin/categories"
import { useAdminCategories } from "@/hooks/useAdminCategories"
import type { Category, CategoryOption } from "@/types/admin-category"

// ---------------------------------------------------------------------------
// Helper: inject product counts into category tree recursively
// ---------------------------------------------------------------------------
function injectProductCounts(
  cats: Category[],
  counts: Record<string, number>
): Category[] {
  return cats.map((cat) => ({
    ...cat,
    productCount: counts[cat.id] || 0,
    children: injectProductCounts(cat.children || [], counts),
  }))
}

// ---------------------------------------------------------------------------
// Helper: find category anywhere in tree
// ---------------------------------------------------------------------------
function findInTree(cats: Category[], id: string): Category | null {
  for (const cat of cats) {
    if (cat.id === id) return cat
    const found = findInTree(cat.children || [], id)
    if (found) return found
  }
  return null
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [parentOptions, setParentOptions] = useState<CategoryOption[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchCategoryTree,
    fetchProductCounts,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleStatus,
    uploadFile,
    buildParentOptions,
  } = useAdminCategories()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [treeResult, counts] = await Promise.all([
        fetchCategoryTree(),
        fetchProductCounts(),
      ])
      const treeWithCounts = injectProductCounts(treeResult.tree, counts)
      setCategories(treeWithCounts)
      setParentOptions(buildParentOptions(treeWithCounts))
    } catch {
      showToast("Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }, [fetchCategoryTree, fetchProductCounts, buildParentOptions, showToast])

  // Initial load
  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectCategory = useCallback((id: string) => {
    setSelectedCategoryId(id)
  }, [])

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null)
  }, [])

  const handleEditCategory = useCallback((category: Category) => {
    setEditingCategory(category)
  }, [])

  const handleDeleteCategory = useCallback(
    async (id: string, reassignToId?: string) => {
      const ok = await deleteCategory(id, reassignToId)
      if (ok) {
        setSelectedCategoryId((prev) => (prev === id ? null : prev))
        await loadData()
        showToast("Category deleted")
      } else {
        showToast("Failed to delete category")
      }
    },
    [deleteCategory, loadData, showToast]
  )

  const handleToggleStatus = useCallback(
    async (id: string) => {
      const cat = findInTree(categories, id)
      if (!cat) return
      const currentlyActive = cat.status === "active"
      const updated = await toggleStatus(id, currentlyActive)
      if (updated) {
        await loadData()
        showToast(currentlyActive ? "Category deactivated" : "Category activated")
      } else {
        showToast("Failed to update status")
      }
    },
    [categories, toggleStatus, loadData, showToast]
  )

  const handleSaveCategory = useCallback(
    async (data: Partial<Category>) => {
      let ok: Category | null
      if (editingCategory?.id) {
        ok = await updateCategory(editingCategory.id, data)
      } else {
        ok = await createCategory(data)
      }
      if (ok) {
        setEditingCategory(null)
        await loadData()
        showToast(editingCategory?.id ? "Category updated" : "Category created")
      } else {
        showToast(editingCategory?.id ? "Failed to update category" : "Failed to create category")
        throw new Error("Save failed")
      }
    },
    [editingCategory, updateCategory, createCategory, loadData, showToast]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null)
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

      <AdminCategoryManagement
        categories={categories}
        parentOptions={parentOptions}
        selectedCategoryId={selectedCategoryId}
        editingCategory={editingCategory}
        isLoading={isLoading}
        onSelectCategory={handleSelectCategory}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onToggleStatus={handleToggleStatus}
        onSaveCategory={handleSaveCategory}
        onCancelEdit={handleCancelEdit}
        onImageUpload={handleUploadFile}
      />
    </>
  )
}
