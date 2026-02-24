"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, SlidersHorizontal, X, Star } from "lucide-react"
import type {
  StorefrontProduct,
  CategoryHero,
  FilterGroup as FilterGroupType,
  SortOption,
  Breadcrumb,
} from "@/types/storefront"
import { ProductCard } from "./ProductCard"
import { primary, secondary, earth, bg, gradients, fonts } from "@/lib/theme"

function FilterSidebar({
  filterGroups,
  activeFilters,
  onFilterChange,
  onPriceRangeChange,
  onClearFilters,
}: {
  filterGroups: FilterGroupType[]
  activeFilters: Record<string, string[]>
  onFilterChange?: (filterId: string, values: string[]) => void
  onPriceRangeChange?: (min: number, max: number) => void
  onClearFilters?: () => void
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [priceRange, setPriceRange] = useState<[number, number]>([99, 10000])

  const totalActive = Object.values(activeFilters).flat().length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{ color: earth[700], fontFamily: fonts.body }}
        >
          Filters
          {totalActive > 0 && (
            <span
              className="ml-2 px-2 py-0.5 text-[10px] rounded-full text-white"
              style={{ background: secondary[500] }}
            >
              {totalActive}
            </span>
          )}
        </h3>
        {totalActive > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs font-medium transition-colors"
            style={{ color: secondary[500], fontFamily: fonts.body }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-1">
        {filterGroups.map((group) => {
          const isCollapsed = collapsed[group.id] ?? false
          const activeValues = activeFilters[group.id] || []

          return (
            <div key={group.id} className="border-b" style={{ borderColor: "#f0ebe4" }}>
              <button
                onClick={() =>
                  setCollapsed((p) => ({ ...p, [group.id]: !isCollapsed }))
                }
                className="w-full flex items-center justify-between py-3.5"
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: earth[700], fontFamily: fonts.body }}
                >
                  {group.label}
                </span>
                <ChevronDown
                  className="w-4 h-4 transition-transform duration-200"
                  style={{
                    color: earth[300],
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  }}
                />
              </button>

              {!isCollapsed && (
                <div className="pb-4">
                  {group.type === "range" && (
                    <div className="px-1">
                      <input
                        type="range"
                        min={group.min}
                        max={group.max}
                        value={priceRange[1]}
                        onChange={(e) => {
                          const v = Number(e.target.value)
                          setPriceRange([priceRange[0], v])
                          onPriceRangeChange?.(priceRange[0], v)
                        }}
                        className="w-full accent-[#013f47]"
                      />
                      <div className="flex justify-between mt-1">
                        <span
                          className="text-xs"
                          style={{ color: earth[300], fontFamily: fonts.body }}
                        >
                          ₹{priceRange[0].toLocaleString()}
                        </span>
                        <span
                          className="text-xs"
                          style={{ color: earth[300], fontFamily: fonts.body }}
                        >
                          ₹{priceRange[1].toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {group.type === "rating" &&
                    group.options.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={activeValues.includes(opt.value)}
                          onChange={() => {
                            const next = activeValues.includes(opt.value)
                              ? activeValues.filter((v) => v !== opt.value)
                              : [...activeValues, opt.value]
                            onFilterChange?.(group.id, next)
                          }}
                          className="w-3.5 h-3.5 rounded accent-[#013f47]"
                        />
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className="w-3 h-3"
                              fill={
                                s <= Number(opt.value) ? "#F59E0B" : "none"
                              }
                              stroke={
                                s <= Number(opt.value) ? "#F59E0B" : "#d1c9c0"
                              }
                              strokeWidth={1.5}
                            />
                          ))}
                          <span
                            className="text-xs ml-1"
                            style={{ color: earth[300] }}
                          >
                            & above
                          </span>
                        </div>
                        <span
                          className="text-[11px] ml-auto"
                          style={{ color: earth[300] }}
                        >
                          ({opt.count})
                        </span>
                      </label>
                    ))}

                  {(group.type === "checkbox" || group.type === "toggle") &&
                    group.options.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2.5 py-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={activeValues.includes(opt.value)}
                          onChange={() => {
                            const next = activeValues.includes(opt.value)
                              ? activeValues.filter((v) => v !== opt.value)
                              : [...activeValues, opt.value]
                            onFilterChange?.(group.id, next)
                          }}
                          className="w-3.5 h-3.5 rounded accent-[#013f47]"
                        />
                        <span
                          className="text-sm"
                          style={{ color: earth[600], fontFamily: fonts.body }}
                        >
                          {opt.label}
                        </span>
                        <span
                          className="text-[11px] ml-auto"
                          style={{ color: earth[300] }}
                        >
                          ({opt.count})
                        </span>
                      </label>
                    ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Loading skeleton for product grid
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl overflow-hidden"
          style={{ background: bg.card, border: "1px solid #f0ebe4" }}
        >
          <div
            className="aspect-square animate-pulse"
            style={{ background: "#f0ebe4" }}
          />
          <div className="p-3.5 space-y-2">
            <div
              className="h-4 rounded animate-pulse"
              style={{ background: "#f0ebe4", width: "80%" }}
            />
            <div
              className="h-3 rounded animate-pulse"
              style={{ background: "#f0ebe4", width: "50%" }}
            />
            <div
              className="h-5 rounded animate-pulse"
              style={{ background: "#f0ebe4", width: "40%" }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface CategoryListingProps {
  categoryHero: CategoryHero
  breadcrumbs: Breadcrumb[]
  products: StorefrontProduct[]
  totalCount: number
  currentPage: number
  totalPages: number
  filterGroups: FilterGroupType[]
  activeFilters: Record<string, string[]>
  sortOptions: SortOption[]
  currentSort: string
  isLoading?: boolean
  onProductClick?: (slug: string) => void
  onQuickView?: (productId: string) => void
  onAddToCart?: (productId: string) => void
  onToggleWishlist?: (productId: string) => void
  onFilterChange?: (filterId: string, values: string[]) => void
  onPriceRangeChange?: (min: number, max: number) => void
  onClearFilters?: () => void
  onSortChange?: (sortValue: string) => void
  onPageChange?: (page: number) => void
  isWishlisted?: (productId: string) => boolean
}

export function CategoryListing({
  categoryHero,
  breadcrumbs,
  products,
  totalCount,
  currentPage,
  totalPages,
  filterGroups,
  activeFilters,
  sortOptions,
  currentSort,
  isLoading,
  onProductClick,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  onFilterChange,
  onPriceRangeChange,
  onClearFilters,
  onSortChange,
  onPageChange,
  isWishlisted,
}: CategoryListingProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  return (
    <div style={{ background: bg.primary, minHeight: "100vh" }}>
      {/* CATEGORY HERO BANNER */}
      <section className="relative overflow-hidden" style={{ minHeight: 220 }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${categoryHero.imageUrl})` }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(1,63,71,0.78)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <h1
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: fonts.heading }}
          >
            {categoryHero.name}
          </h1>
          {categoryHero.description && (
            <p
              className="mt-3 text-sm sm:text-base leading-relaxed line-clamp-3 text-justify"
              style={{
                color: "rgba(255,255,255,0.88)",
                fontFamily: fonts.body,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {categoryHero.description}
            </p>
          )}
          <p
            className="mt-3 text-xs font-semibold tracking-widest uppercase"
            style={{
              color: "rgba(255,255,255,0.55)",
              fontFamily: fonts.body,
            }}
          >
            {categoryHero.productCount} products
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 mb-5 flex-wrap">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5"
                  style={{ color: earth[300] }}
                />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-sm transition-colors"
                  style={{ color: earth[400], fontFamily: fonts.body }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = primary[500])
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = earth[400])
                  }
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  className="text-sm font-medium"
                  style={{ color: earth[700], fontFamily: fonts.body }}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p
            className="text-sm"
            style={{ color: earth[400], fontFamily: fonts.body }}
          >
            Showing {products.length} of {totalCount} results
          </p>
          <div className="flex items-center gap-3">
            {filterGroups.length > 0 && (
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all"
              style={{
                borderColor: "#e8e0d8",
                color: earth[600],
                fontFamily: fonts.body,
              }}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            )}
            <select
              value={currentSort}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{
                borderColor: "#e8e0d8",
                color: earth[600],
                background: bg.card,
                fontFamily: fonts.body,
              }}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-8">
          {/* Desktop sidebar — hidden when no filter groups */}
          {filterGroups.length > 0 && (
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div
              className="sticky top-6 rounded-xl p-5"
              style={{ background: bg.card, border: "1px solid #f0ebe4" }}
            >
              <FilterSidebar
                filterGroups={filterGroups}
                activeFilters={activeFilters}
                onFilterChange={onFilterChange}
                onPriceRangeChange={onPriceRangeChange}
                onClearFilters={onClearFilters}
              />
            </div>
          </aside>
          )}

          {/* Product grid */}
          <div className="flex-1">
            {isLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div
                className="text-center py-20 rounded-xl"
                style={{ background: bg.card, border: "1px solid #f0ebe4" }}
              >
                <p
                  className="text-lg font-semibold mb-2"
                  style={{ color: earth[700], fontFamily: fonts.heading }}
                >
                  No products found
                </p>
                <p
                  className="text-sm"
                  style={{ color: earth[400], fontFamily: fonts.body }}
                >
                  Try adjusting your filters or browse all categories.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                    onQuickView={onQuickView}
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={isWishlisted?.(product.id)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => onPageChange?.(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-40"
                  style={{
                    borderColor: "#e8e0d8",
                    color: earth[600],
                    fontFamily: fonts.body,
                  }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => onPageChange?.(page)}
                      className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background:
                          page === currentPage ? primary[500] : "transparent",
                        color: page === currentPage ? "#fff" : earth[400],
                        fontFamily: fonts.body,
                      }}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => onPageChange?.(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-medium border transition-all disabled:opacity-40"
                  style={{
                    borderColor: "#e8e0d8",
                    color: earth[600],
                    fontFamily: fonts.body,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer — only when filter groups exist */}
      {mobileFiltersOpen && filterGroups.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto p-6"
            style={{ background: bg.card }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-base font-semibold"
                style={{ color: earth[700], fontFamily: fonts.body }}
              >
                Filters
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)}>
                <X className="w-5 h-5" style={{ color: earth[400] }} />
              </button>
            </div>
            <FilterSidebar
              filterGroups={filterGroups}
              activeFilters={activeFilters}
              onFilterChange={onFilterChange}
              onPriceRangeChange={onPriceRangeChange}
              onClearFilters={onClearFilters}
            />
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: primary[500], fontFamily: fonts.body }}
            >
              Show {totalCount} Results
            </button>
          </div>
        </>
      )}
    </div>
  )
}
