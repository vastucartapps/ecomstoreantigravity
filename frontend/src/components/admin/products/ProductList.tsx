"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Plus,
  Upload,
  LayoutGrid,
  List,
  Edit2,
  Copy,
  Trash2,
  Star,
  X,
} from "lucide-react"
import { ThemeSelect } from "@/components/ui/ThemeSelect"
import type {
  Product,
  CategoryOption,
  ProductFilters,
  ViewMode,
  BulkAction,
  ProductListProps,
} from "@/types/admin-product"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
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
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

// Extracted to module level — inline skeleton inside ProductList caused
// unnecessary unmount/remount on every state change in the parent.
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg animate-pulse" style={{ backgroundColor: c.card, boxShadow: c.shadow }}>
      <div className="h-28 bg-stone-200" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-2.5 bg-stone-200 rounded w-1/2" />
        <div className="h-3 bg-stone-200 rounded w-3/4" />
        <div className="h-2.5 bg-stone-200 rounded w-1/3" />
        <div className="h-4 bg-stone-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  )
}

export function ProductList({
  products,
  categories,
  filters,
  viewMode,
  totalCount,
  isLoading,
  onChangeViewMode,
  onChangeFilters,
  onSearch,
  onAddProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onBulkAction,
}: ProductListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState(filters.search || "")
  const [toast, setToast] = useState<string | null>(null)

  // Show toast then auto-dismiss
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)))
    }
  }

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkAction = (action: BulkAction) => {
    if (action === "export") {
      showToast("CSV export coming soon")
      return
    }
    onBulkAction?.(action, Array.from(selectedIds))
    setSelectedIds(new Set())
  }

  const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`

  const calculateDiscount = (mrp: number, price: number) => {
    if (mrp <= price) return 0
    return Math.round(((mrp - price) / mrp) * 100)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return { bg: c.successLight, text: c.success, label: "Active" }
      case "inactive": return { bg: c.errorLight, text: c.error, label: "Inactive" }
      case "draft": return { bg: c.warningLight, text: c.warning, label: "Draft" }
      default: return { bg: c.subtle, text: c.earth600, label: status }
    }
  }

  const getStockStyle = (stockLevel: string) => {
    switch (stockLevel) {
      case "in_stock": return { bg: c.successLight, text: c.success, label: "In Stock" }
      case "low_stock": return { bg: c.warningLight, text: c.warning, label: "Low Stock" }
      case "out_of_stock": return { bg: c.errorLight, text: c.error, label: "Out of Stock" }
      default: return { bg: c.subtle, text: c.earth600, label: stockLevel }
    }
  }

  const emptyState = (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-20"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="mb-4 text-6xl" style={{ color: c.earth300 }}>📦</div>
      <h3 className="text-lg font-medium" style={{ fontFamily: fonts.heading, color: c.earth600 }}>
        {filters.search || filters.status !== "all" || filters.category || filters.stockLevel !== "all"
          ? "No products match your search"
          : "No products yet"}
      </h3>
      <p className="mt-1 text-sm" style={{ color: c.earth400 }}>
        {filters.search || filters.status !== "all" || filters.category || filters.stockLevel !== "all"
          ? "Try adjusting your filters or search query"
          : "Click \"Add Product\" to create your first product"}
      </p>
      {!filters.search && filters.status === "all" && !filters.category && filters.stockLevel === "all" && (
        <button
          onClick={onAddProduct}
          className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: c.gradient }}
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg"
          style={{ backgroundColor: c.primary500, color: "#fff", fontFamily: fonts.body, fontSize: "0.875rem" }}
        >
          {toast}
          <button onClick={() => setToast(null)}>
            <X className="h-4 w-4 opacity-70" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold" style={{ fontFamily: fonts.heading, color: c.earth700 }}>
            Products
          </h1>
          <span
            className="rounded-full px-3 py-1 text-sm font-medium"
            style={{ backgroundColor: c.primary50, color: c.primary500 }}
          >
            {totalCount}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: c.gradient, boxShadow: c.shadow }}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>

          <button
            onClick={() => showToast("CSV import coming soon")}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all hover:opacity-80"
            style={{ borderColor: c.secondary500, color: c.secondary500, backgroundColor: c.card }}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg p-4" style={{ backgroundColor: c.card, boxShadow: c.shadow }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: c.earth400 }} />
            <input
              type="text"
              placeholder="Search products by name, SKU..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: c.subtle, backgroundColor: c.bg, color: c.earth700 }}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <ThemeSelect
              value={filters.status || "all"}
              onChange={(v) => onChangeFilters?.({ status: v as ProductFilters["status"] })}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "draft", label: "Draft" },
              ]}
              size="sm"
            />

            {/* Category Filter */}
            <ThemeSelect
              value={filters.category || "all"}
              onChange={(v) => onChangeFilters?.({ category: v === "all" ? "" : v })}
              options={[
                { value: "all", label: "All Categories" },
                ...categories.map((cat) => ({ value: cat.id, label: cat.name })),
              ]}
              size="sm"
            />

            {/* Stock Filter */}
            <ThemeSelect
              value={filters.stockLevel || "all"}
              onChange={(v) => onChangeFilters?.({ stockLevel: v as ProductFilters["stockLevel"] })}
              options={[
                { value: "all", label: "All Stock" },
                { value: "in_stock", label: "In Stock" },
                { value: "low_stock", label: "Low Stock" },
                { value: "out_of_stock", label: "Out of Stock" },
              ]}
              size="sm"
            />
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 rounded-lg border p-1" style={{ borderColor: c.subtle }}>
            <button
              onClick={() => onChangeViewMode?.("grid")}
              className="rounded p-2 transition-all"
              style={{
                backgroundColor: viewMode === "grid" ? c.primary50 : "transparent",
                color: viewMode === "grid" ? c.primary500 : c.earth400,
              }}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onChangeViewMode?.("table")}
              className="rounded p-2 transition-all"
              style={{
                backgroundColor: viewMode === "table" ? c.primary50 : "transparent",
                color: viewMode === "table" ? c.primary500 : c.earth400,
              }}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (() => {
        const selectedProducts = products.filter((p) => selectedIds.has(p.id))
        const activeCount = selectedProducts.filter((p) => p.status === "active").length
        const inactiveCount = selectedProducts.filter((p) => p.status !== "active").length
        const isSingle = selectedIds.size === 1
        const singleProduct = isSingle ? selectedProducts[0] : null

        return (
          <div
            className="flex flex-wrap items-center gap-3 rounded-lg p-3 sm:p-4"
            style={{ backgroundColor: c.primary50, borderLeft: `4px solid ${c.primary500}` }}
          >
            <span className="text-sm font-medium" style={{ color: c.primary500 }}>
              {selectedIds.size} selected
            </span>

            <div className="flex flex-wrap gap-2">
              {/* Single selection: context-aware toggle */}
              {isSingle && singleProduct && (
                singleProduct.status === "active" ? (
                  <button
                    onClick={() => handleBulkAction("deactivate")}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: c.warning, color: "white" }}
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleBulkAction("activate")}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: c.success, color: "white" }}
                  >
                    Activate
                  </button>
                )
              )}

              {/* Multiple selection: show each button only when it applies */}
              {!isSingle && inactiveCount > 0 && (
                <button
                  onClick={() => handleBulkAction("activate")}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: c.success, color: "white" }}
                >
                  Activate ({inactiveCount})
                </button>
              )}
              {!isSingle && activeCount > 0 && (
                <button
                  onClick={() => handleBulkAction("deactivate")}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                  style={{ backgroundColor: c.warning, color: "white" }}
                >
                  Deactivate ({activeCount})
                </button>
              )}

              <button
                onClick={() => handleBulkAction("delete")}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: c.error, color: "white" }}
              >
                Delete
              </button>
              <button
                onClick={() => showToast("CSV export coming soon")}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium transition-all hover:opacity-80"
                style={{ borderColor: c.primary500, backgroundColor: c.card, color: c.primary500 }}
              >
                Export
              </button>
            </div>

            <button
              onClick={handleSelectAll}
              className="ml-auto text-sm font-medium underline"
              style={{ color: c.primary500 }}
            >
              {selectedIds.size === products.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        )
      })()}

      {/* Grid View */}
      {viewMode === "grid" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            emptyState
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product) => {
                const statusStyle = getStatusStyle(product.status)
                const stockStyle = getStockStyle(product.stockLevel)
                const discount = calculateDiscount(product.mrp, product.price)

                return (
                  <div
                    key={product.id}
                    className="group relative overflow-hidden rounded-lg transition-all hover:shadow-md"
                    style={{ backgroundColor: c.card, boxShadow: c.shadow }}
                  >
                    {/* Gradient top border */}
                    <div className="h-0.5" style={{ background: c.gradient }} />

                    {/* Image — fixed compact height */}
                    <div className="relative h-28 overflow-hidden bg-stone-100">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl" style={{ color: c.earth300 }}>
                          📦
                        </div>
                      )}

                      {/* Checkbox */}
                      <div className="absolute left-1.5 top-1.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="h-4 w-4 cursor-pointer rounded border-2 border-white bg-white/90 backdrop-blur-sm"
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute right-1.5 top-1.5">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.label}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <button
                          onClick={() => onEditProduct?.(product.id)}
                          className="rounded bg-white/90 p-1.5 backdrop-blur-sm transition-all hover:bg-white"
                          style={{ color: c.primary500 }}
                          title="Edit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDuplicateProduct?.(product.id)}
                          className="rounded bg-white/90 p-1.5 backdrop-blur-sm transition-all hover:bg-white"
                          style={{ color: c.earth600 }}
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct?.(product.id)}
                          className="rounded bg-white/90 p-1.5 backdrop-blur-sm transition-all hover:bg-white"
                          style={{ color: c.error }}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5">
                      {/* Stock pill */}
                      <div className="mb-1.5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: stockStyle.bg, color: stockStyle.text }}
                        >
                          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: stockStyle.text }} />
                          {stockStyle.label}
                        </span>
                      </div>

                      <h3 className="truncate text-xs font-semibold leading-tight" style={{ fontFamily: fonts.heading, color: c.earth700 }}>
                        {product.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[10px]" style={{ color: c.earth400 }}>
                        {product.category}
                      </p>

                      <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: c.primary500 }}>
                          {formatPrice(product.price)}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] font-medium" style={{ color: c.secondary500 }}>
                            {discount}% off
                          </span>
                        )}
                      </div>

                      {product.variantCount > 1 && (
                        <p className="mt-1 text-[10px]" style={{ color: c.earth400 }}>
                          {product.variantCount} variants
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-hidden rounded-lg" style={{ backgroundColor: c.card, boxShadow: c.shadow }}>
          {isLoading ? (
            <div className="animate-pulse p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-stone-100 rounded" />
              ))}
            </div>
          ) : products.length === 0 ? (
            emptyState
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: c.bg }}>
                  <tr>
                    <th className="p-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === products.length && products.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 cursor-pointer rounded"
                      />
                    </th>
                    {["Image", "Name & SKU", "Category", "Price", "Stock", "Status", "Rating", "Actions"].map((col) => (
                      <th
                        key={col}
                        className={`p-4 text-left text-xs font-semibold uppercase tracking-wide${col === "Actions" ? " sticky right-0 z-10" : ""}`}
                        style={{
                          color: c.earth600,
                          textAlign: col === "Actions" ? "right" : "left",
                          backgroundColor: col === "Actions" ? c.bg : undefined,
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const statusStyle = getStatusStyle(product.status)
                    const stockStyle = getStockStyle(product.stockLevel)

                    return (
                      <tr
                        key={product.id}
                        className="transition-colors hover:bg-stone-50"
                        style={{ borderTop: index === 0 ? "none" : `1px solid ${c.subtle}` }}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            className="h-4 w-4 cursor-pointer rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div className="h-12 w-12 overflow-hidden rounded bg-stone-100">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl" style={{ color: c.earth300 }}>📦</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium" style={{ fontFamily: fonts.heading, color: c.earth700 }}>{product.name}</p>
                          <p className="text-xs" style={{ fontFamily: fonts.mono, color: c.earth400 }}>{product.sku}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-sm" style={{ color: c.earth600 }}>{product.category}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold" style={{ color: c.primary500 }}>{formatPrice(product.price)}</p>
                          {product.mrp > product.price && (
                            <p className="text-xs line-through" style={{ color: c.earth300 }}>{formatPrice(product.mrp)}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stockStyle.text }} />
                            <span className="text-sm" style={{ color: stockStyle.text }}>{stockStyle.label}</span>
                            <span className="text-xs" style={{ color: c.earth400 }}>({product.stock})</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-block rounded-full px-2 py-1 text-xs font-medium"
                            style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                          >
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-current" style={{ color: c.warning }} />
                            <span className="text-sm font-medium" style={{ color: c.earth700 }}>{Number(product.rating || 0).toFixed(1)}</span>
                            <span className="text-xs" style={{ color: c.earth400 }}>({product.reviewCount || 0})</span>
                          </div>
                        </td>
                        <td
                          className="p-4 sticky right-0 z-10"
                          style={{ backgroundColor: index % 2 === 0 ? c.card : "#faf8f5" }}
                        >
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => onEditProduct?.(product.id)}
                              className="rounded p-2 transition-all hover:bg-stone-100"
                              style={{ color: c.primary500 }}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDuplicateProduct?.(product.id)}
                              className="rounded p-2 transition-all hover:bg-stone-100"
                              style={{ color: c.earth600 }}
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct?.(product.id)}
                              className="rounded p-2 transition-all hover:bg-stone-100"
                              style={{ color: c.error }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
