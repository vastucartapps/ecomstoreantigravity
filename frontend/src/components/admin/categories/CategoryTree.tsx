"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Plus, Eye, EyeOff, Package } from "lucide-react"
import type { Category, CategoryTreeProps } from "@/types/admin-category"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth700: "#433b35",
  success: "#10B981",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
}

interface CategoryNodeProps {
  category: Category
  depth: number
  selectedCategoryId: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelectCategory?: (categoryId: string) => void
  onToggleStatus?: (categoryId: string) => void
}

export function CategoryNode({
  category,
  depth,
  selectedCategoryId,
  expandedIds,
  onToggleExpand,
  onSelectCategory,
  onToggleStatus,
}: CategoryNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isSelected = selectedCategoryId === category.id

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all"
        style={{
          paddingLeft: `${depth * 1.5 + 0.75}rem`,
          backgroundColor: isSelected ? c.primary50 : "transparent",
          borderLeft: isSelected ? `3px solid ${c.primary500}` : "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = c.subtle
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"
        }}
        onClick={() => onSelectCategory?.(category.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(category.id)
            }}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} style={{ color: c.earth500 }} />
            ) : (
              <ChevronRight size={16} style={{ color: c.earth500 }} />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-8 h-8 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: c.primary100 }}
          >
            <Package size={16} style={{ color: c.primary500 }} />
          </div>
        )}

        <span
          className="flex-1 text-sm font-medium truncate"
          style={{ color: c.earth700, fontFamily: fonts.body }}
        >
          {category.name}
        </span>

        <span
          className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
          style={{ backgroundColor: c.primary100, color: c.primary500, fontFamily: fonts.body }}
        >
          {category.productCount}
        </span>

        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.status === "active" ? c.success : c.earth300 }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleStatus?.(category.id)
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition-all flex-shrink-0"
          title={category.status === "active" ? "Deactivate" : "Activate"}
        >
          {category.status === "active" ? (
            <Eye size={14} style={{ color: c.earth500 }} />
          ) : (
            <EyeOff size={14} style={{ color: c.earth300 }} />
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              selectedCategoryId={selectedCategoryId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onSelectCategory={onSelectCategory}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({
  categories,
  selectedCategoryId,
  onSelectCategory,
  onToggleStatus,
  onAddCategory,
}: CategoryTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div
      className="h-full rounded-lg overflow-hidden flex flex-col"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `1px solid ${c.primary100}` }}
      >
        <h2
          className="text-xl font-semibold"
          style={{ color: c.earth700, fontFamily: fonts.heading }}
        >
          Categories
        </h2>
        <button
          onClick={onAddCategory}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: c.primary500, color: c.card, fontFamily: fonts.body }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = c.primary400
            e.currentTarget.style.boxShadow = c.shadowHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = c.primary500
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Package size={48} style={{ color: c.earth300 }} className="mb-3" />
            <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
              No categories yet. Click &ldquo;Add Category&rdquo; to get started.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <CategoryNode
              key={category.id}
              category={category}
              depth={0}
              selectedCategoryId={selectedCategoryId}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onSelectCategory={onSelectCategory}
              onToggleStatus={onToggleStatus}
            />
          ))
        )}
      </div>
    </div>
  )
}
