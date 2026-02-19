"use client"

import { useState } from "react"
import { Edit, Trash2, Eye, EyeOff, Package, Calendar, Hash } from "lucide-react"
import type { Category, CategoryDetailProps, CategoryOption } from "@/types/admin-category"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  success: "#10B981",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

// Extended props with parentOptions for reassignment
interface ExtendedCategoryDetailProps extends CategoryDetailProps {
  parentOptions: CategoryOption[]
}

export function CategoryDetail({
  category,
  parentOptions,
  onEdit,
  onDelete,
  onToggleStatus,
}: ExtendedCategoryDetailProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reassignToCategoryId, setReassignToCategoryId] = useState("")

  const handleDeleteConfirm = () => {
    onDelete?.(category!.id, reassignToCategoryId || undefined)
    setShowDeleteConfirm(false)
    setReassignToCategoryId("")
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setReassignToCategoryId("")
  }

  if (!category) {
    return (
      <div
        className="h-full rounded-lg flex items-center justify-center"
        style={{ backgroundColor: c.card, boxShadow: c.shadow }}
      >
        <div className="text-center px-6">
          <Package size={64} style={{ color: c.earth300 }} className="mx-auto mb-4" />
          <p
            className="text-lg font-medium mb-2"
            style={{ color: c.earth500, fontFamily: fonts.heading }}
          >
            Select a category to view details
          </p>
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Click on a category in the tree to see its details and manage it.
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Filter out the category itself from reassignment options
  const reassignOptions = parentOptions.filter((opt) => opt.id !== category.id)

  return (
    <div
      className="h-full rounded-lg overflow-y-auto"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="p-6">
        {/* Category Image */}
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full aspect-video object-cover rounded-lg mb-6"
          />
        ) : (
          <div
            className="w-full aspect-video rounded-lg flex items-center justify-center mb-6"
            style={{ backgroundColor: c.primary50 }}
          >
            <Package size={64} style={{ color: c.primary400 }} />
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-3xl font-semibold mb-2"
            style={{ color: c.earth700, fontFamily: fonts.heading }}
          >
            {category.name}
          </h2>
          {category.parentName && (
            <p className="text-sm mb-3" style={{ color: c.earth400, fontFamily: fonts.body }}>
              Parent:{" "}
              <span style={{ color: c.primary500, fontFamily: fonts.mono }}>
                {category.parentName}
              </span>
            </p>
          )}
          {category.description && (
            <p
              className="text-base leading-relaxed"
              style={{ color: c.earth600, fontFamily: fonts.body }}
            >
              {category.description}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg" style={{ backgroundColor: c.primary50 }}>
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} style={{ color: c.primary500 }} />
              <p
                className="text-xs font-medium"
                style={{ color: c.primary500, fontFamily: fonts.body }}
              >
                Products
              </p>
            </div>
            <p
              className="text-2xl font-semibold"
              style={{ color: c.earth700, fontFamily: fonts.heading }}
            >
              {category.productCount}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: c.secondary50 }}>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={16} style={{ color: c.secondary500 }} />
              <p
                className="text-xs font-medium"
                style={{ color: c.secondary500, fontFamily: fonts.body }}
              >
                Display Order
              </p>
            </div>
            <p
              className="text-2xl font-semibold"
              style={{ color: c.earth700, fontFamily: fonts.heading }}
            >
              {category.displayOrder}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: c.subtle }}>
            <p
              className="text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Status
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: category.status === "active" ? c.success : c.earth300,
                }}
              />
              <p
                className="text-sm font-medium capitalize"
                style={{ color: c.earth700, fontFamily: fonts.body }}
              >
                {category.status}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: c.subtle }}>
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={16} style={{ color: c.earth500 }} />
              <p
                className="text-xs font-medium"
                style={{ color: c.earth500, fontFamily: fonts.body }}
              >
                Created
              </p>
            </div>
            <p className="text-sm" style={{ color: c.earth700, fontFamily: fonts.body }}>
              {formatDate(category.createdAt)}
            </p>
          </div>
        </div>

        {/* SEO Section */}
        {(category.seo?.metaTitle || category.seo?.metaDescription) && (
          <div className="mb-6">
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: c.earth700, fontFamily: fonts.heading }}
            >
              SEO Settings
            </h3>
            <div className="space-y-3">
              {category.seo.metaTitle && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: c.subtle }}>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: c.earth500, fontFamily: fonts.body }}
                  >
                    Meta Title
                  </p>
                  <p className="text-sm" style={{ color: c.earth700, fontFamily: fonts.body }}>
                    {category.seo.metaTitle}
                  </p>
                </div>
              )}
              {category.seo.metaDescription && (
                <div className="p-4 rounded-lg" style={{ backgroundColor: c.subtle }}>
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: c.earth500, fontFamily: fonts.body }}
                  >
                    Meta Description
                  </p>
                  <p className="text-sm" style={{ color: c.earth700, fontFamily: fonts.body }}>
                    {category.seo.metaDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google Merchant Section */}
        {category.googleMerchant?.googleProductCategory && (
          <div className="mb-6">
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: c.earth700, fontFamily: fonts.heading }}
            >
              Google Shopping
            </h3>
            <div className="p-4 rounded-lg" style={{ backgroundColor: c.subtle }}>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: c.earth500, fontFamily: fonts.body }}
              >
                Google Product Category
              </p>
              <p
                className="text-sm"
                style={{ color: c.earth700, fontFamily: fonts.mono }}
              >
                {category.googleMerchant.googleProductCategory}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="flex flex-wrap gap-3 pt-4"
          style={{ borderTop: `1px solid ${c.primary100}` }}
        >
          <button
            onClick={() => onEdit?.(category)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
            <Edit size={16} />
            Edit Category
          </button>

          <button
            onClick={() => onToggleStatus?.(category.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: c.earth600, backgroundColor: "transparent", fontFamily: fonts.body }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = c.subtle
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            {category.status === "active" ? (
              <>
                <EyeOff size={16} />
                Deactivate
              </>
            ) : (
              <>
                <Eye size={16} />
                Activate
              </>
            )}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              color: c.error,
              backgroundColor: "transparent",
              border: `1px solid ${c.error}`,
              fontFamily: fonts.body,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = c.errorLight
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div
            className="mt-4 p-4 rounded-lg"
            style={{ backgroundColor: c.errorLight, border: `1px solid ${c.error}` }}
          >
            <p
              className="text-sm font-medium mb-2"
              style={{ color: c.error, fontFamily: fonts.body }}
            >
              Delete &ldquo;{category.name}&rdquo;?
            </p>

            {category.productCount > 0 ? (
              <div className="mb-3">
                <p className="text-sm mb-3" style={{ color: c.earth600, fontFamily: fonts.body }}>
                  This category has{" "}
                  <strong>{category.productCount} product(s)</strong>. Products can belong to
                  multiple categories — choose where to reassign them, or leave blank to simply
                  unlink.
                </p>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  Reassign products to:
                </label>
                <select
                  value={reassignToCategoryId}
                  onChange={(e) => setReassignToCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    border: `1px solid ${c.earth300}`,
                    backgroundColor: c.card,
                    color: c.earth700,
                    fontFamily: fonts.body,
                  }}
                >
                  <option value="">— Leave unlinked —</option>
                  {reassignOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {"— ".repeat(opt.depth)}
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm mb-3" style={{ color: c.earth600, fontFamily: fonts.body }}>
                This category has no products. It will be permanently deleted.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 rounded text-sm font-medium transition-opacity"
                style={{ backgroundColor: c.error, color: c.card, fontFamily: fonts.body }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1"
                }}
              >
                Yes, Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
                style={{ color: c.earth600, backgroundColor: c.card, fontFamily: fonts.body }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = c.subtle
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = c.card
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
