"use client"

import { useState, useCallback } from "react"
import type {
  AdminCategoryManagementProps,
  Category,
  CategoryOption,
} from "@/types/admin-category"
import { CategoryTree } from "./CategoryTree"
import { CategoryDetail } from "./CategoryDetail"
import { CategoryForm } from "./CategoryForm"

const c = {
  primary500: "#013f47",
  bg: "#fffbf5",
  earth400: "#75615a",
}

const fonts = { body: "'Open Sans', sans-serif" }

type ViewMode = "browse" | "form"

function flattenTree(cats: Category[]): Category[] {
  const result: Category[] = []
  function walk(nodes: Category[]) {
    for (const n of nodes) {
      result.push(n)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(cats)
  return result
}

export function AdminCategoryManagement({
  categories,
  parentOptions,
  selectedCategoryId,
  editingCategory,
  isLoading,
  onSelectCategory,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleStatus,
  onReorder,
  onSaveCategory,
  onCancelEdit,
  onImageUpload,
}: AdminCategoryManagementProps) {
  const [view, setView] = useState<ViewMode>("browse")
  const [isEditing, setIsEditing] = useState(false)

  const handleAddCategory = useCallback(() => {
    setIsEditing(false)
    setView("form")
    onAddCategory?.()
  }, [onAddCategory])

  const handleEditCategory = useCallback(
    (category: Category) => {
      setIsEditing(true)
      setView("form")
      onEditCategory?.(category)
    },
    [onEditCategory]
  )

  const handleCancelWizard = useCallback(() => {
    setView("browse")
    setIsEditing(false)
    onCancelEdit?.()
  }, [onCancelEdit])

  // Wrap save to close form after async completion
  const wrappedSaveCategory = useCallback(
    async (data: Partial<Category>) => {
      await onSaveCategory?.(data)
      setView("browse")
      setIsEditing(false)
    },
    [onSaveCategory]
  )

  // Find selected category from tree (flat search)
  const selectedCategory =
    flattenTree(categories).find((cat) => cat.id === selectedCategoryId) || null

  if (view === "form") {
    // Show loading while editingCategory is being fetched in edit mode
    const isWaitingForCategory = isEditing && !editingCategory

    if (isWaitingForCategory) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div
              className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
              style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
              Loading category…
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="h-full" style={{ backgroundColor: c.bg }}>
        <CategoryForm
          key={editingCategory?.id || "new"}
          category={editingCategory}
          parentOptions={parentOptions}
          isEditing={isEditing && !!editingCategory}
          onSave={wrappedSaveCategory}
          onCancel={handleCancelWizard}
          onImageUpload={onImageUpload}
        />
      </div>
    )
  }

  return (
    <div className="h-full" style={{ backgroundColor: c.bg }}>
      {/* Loading overlay for tree */}
      {isLoading && (
        <div className="flex items-center justify-center h-16 mb-2">
          <div
            className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <span className="ml-2 text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading categories…
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-full">
        {/* Left Panel — Category Tree */}
        <div className="h-full min-h-[400px]">
          <CategoryTree
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
            onToggleStatus={onToggleStatus}
            onReorder={onReorder}
            onAddCategory={handleAddCategory}
          />
        </div>

        {/* Right Panel — Category Detail */}
        <div className="h-full min-h-[400px]">
          <CategoryDetail
            category={selectedCategory}
            parentOptions={parentOptions}
            onEdit={handleEditCategory}
            onDelete={onDeleteCategory}
            onToggleStatus={onToggleStatus}
          />
        </div>
      </div>
    </div>
  )
}
