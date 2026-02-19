/** Product image in the gallery */
export interface ProductImage {
  id: string
  url: string
  alt: string
  type: "primary" | "gallery" | "variant"
  order: number
}

/** A purchasable product variant */
export interface ProductVariant {
  id: string
  attributes: Record<string, string>
  sku: string
  price: number
  mrp: number
  inStock: boolean
  stockCount: number
  colorSwatch: string | null
}

/** Variant attribute definition for the selector UI */
export interface VariantAttribute {
  name: string
  label: string
  type: "dropdown" | "swatch"
  values: string[] | SwatchValue[]
}

export interface SwatchValue {
  value: string
  color: string
}

/** A+ hero image block */
export interface RichContentHero {
  id: string
  type: "hero"
  title: string
  imageUrl: string
  headline: string
  description: string
}

/** A+ comparison table block */
export interface RichContentComparison {
  id: string
  type: "comparison"
  title: string
  products: ComparisonProduct[]
  metrics: ComparisonMetric[]
}

export interface ComparisonProduct {
  asin: string
  name: string
  imageUrl: string
  isCurrentProduct: boolean
}

export interface ComparisonMetric {
  label: string
  values: (boolean | string)[]
}

export type RichContentBlock = RichContentHero | RichContentComparison

/** Specification group with key-value pairs */
export interface SpecificationGroup {
  groupName: string
  specs: { key: string; value: string }[]
}

/** Admin-managed FAQ */
export interface ProductFAQ {
  id: string
  question: string
  answer: string
}

/** Customer-submitted Q&A */
export interface ProductQuestion {
  id: string
  question: string
  askedBy: string
  askedAt: string
  answer: string | null
  answeredBy: string | null
  answeredAt: string | null
  isAdminAnswer: boolean
}

/** Customer review */
export interface ProductReview {
  id: string
  rating: number
  title: string
  text: string
  reviewerName: string
  reviewerLocation: string
  isVerifiedPurchase: boolean
  photos: string[]
  createdAt: string
  variant: string
}

/** Rating breakdown summary */
export interface RatingBreakdown {
  average: number
  total: number
  distribution: Record<string, number>
}

/** Product card for related products carousel */
export interface RelatedProduct {
  id: string
  name: string
  slug: string
  imageUrl: string
  price: number
  mrp: number
  currency: "INR" | "USD"
  rating: number
  reviewCount: number
  variantCount: number
  isNew: boolean
  inStock: boolean
}

/** Core product data for the detail page */
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  currency: "INR" | "USD"
  price: number
  mrp: number
  discountPercent: number
  rating: number
  reviewCount: number
  inStock: boolean
  sku: string
  isNew: boolean
  expressShipping: boolean
  deliveryEstimate: string
  returnPolicy: string
}

/** Props for the Product Detail Page view */
export interface ProductDetailProps {
  product: Product
  images: ProductImage[]
  variants: ProductVariant[]
  variantAttributes: VariantAttribute[]
  richContent: RichContentBlock[]
  specificationGroups: SpecificationGroup[]
  faqs: ProductFAQ[]
  questions: ProductQuestion[]
  reviews: ProductReview[]
  ratingBreakdown: RatingBreakdown
  relatedProducts: RelatedProduct[]
  breadcrumbs: { label: string; href: string | null }[]
  isWishlisted?: boolean
  onAddToCart?: (variantId: string, quantity: number) => void
  onToggleWishlist?: (productId: string) => void
  onShare?: (channel: "whatsapp" | "facebook" | "pinterest" | "copy") => void
  onVariantChange?: (variantId: string) => void
  onAskQuestion?: (question: string) => void
  onProductClick?: (slug: string) => void
  onQuickView?: (productId: string) => void
  onBreadcrumbClick?: (href: string) => void
  onScrollToReviews?: () => void
}

/** Props for the Quick View modal */
export interface QuickViewProps {
  product: Product
  images: ProductImage[]
  variants: ProductVariant[]
  variantAttributes: VariantAttribute[]
  isOpen: boolean
  onClose?: () => void
  onAddToCart?: (variantId: string, quantity: number) => void
  onViewFullDetails?: (slug: string) => void
  onVariantChange?: (variantId: string) => void
}
