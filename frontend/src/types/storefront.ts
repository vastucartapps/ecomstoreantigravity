/** Announcement ribbon at the top of the storefront */
export interface Announcement {
  message: string
  link: string | null
  isActive: boolean
}

/** Full-width homepage hero banner slide */
export interface HeroSlide {
  id: string
  image_url: string
  heading: string
  subtext: string
  cta_label: string
  cta_link: string
  display_order: number
  is_active: boolean
}

/** Category card for the homepage grid */
export interface CategoryCard {
  id: string
  name: string
  imageUrl: string
  slug: string
  productCount: number
}

/** Product card for grids and carousels */
export interface StorefrontProduct {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  mrp: number
  currency: string
  rating: number
  reviewCount: number
  variantCount: number
  isNew: boolean
  inStock: boolean
}

/** Product with deal/discount info and countdown */
export interface DealProduct extends StorefrontProduct {
  discountPercent: number
  expiresAt: string
}

/** Admin-curated testimonial or highlighted review */
export interface Testimonial {
  id: string
  quote: string
  name: string
  location: string
  avatar_url: string | null
  rating: number
  type: "review" | "testimonial"
  product_name: string | null
  is_active: boolean
  display_order: number
}

/** Trust/reassurance badge */
export interface TrustBadge {
  id: string
  label: string
  sublabel: string
  icon: "truck" | "shield" | "refresh" | "badge-check"
}

/** Filter option within a filter group */
export interface FilterOption {
  label: string
  value: string
  count: number
}

/** Sidebar filter group */
export interface FilterGroup {
  id: string
  label: string
  type: "checkbox" | "range" | "rating" | "toggle"
  min: number
  max: number
  options: FilterOption[]
}

/** Sort dropdown option */
export interface SortOption {
  label: string
  value: string
}

/** Breadcrumb navigation item */
export interface Breadcrumb {
  label: string
  href: string | null
}

/** Search autocomplete suggestion */
export interface SearchSuggestion {
  type: "product" | "category" | "query"
  label: string
  imageUrl: string | null
  price: number | null
  slug: string | null
}

/** Category hero banner info */
export interface CategoryHero {
  name: string
  description: string
  imageUrl: string
  slug: string
  productCount: number
}
