/** Product status */
export type ProductStatus = "active" | "inactive" | "draft"

/** Stock level category */
export type StockLevel = "in_stock" | "low_stock" | "out_of_stock"

/** Product variant */
export interface ProductVariant {
  id: string
  sku: string
  label: string
  price: number     // INR selling price (display units, divided by 100)
  mrp: number       // INR MRP (display units)
  currency: "INR" | "USD"
  stock: number
  stockLevel: StockLevel
  priceUSD?: number  // USD selling price (display units)
  mrpUSD?: number    // USD MRP (display units)
}

/** Product image */
export interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
  sortOrder: number
}

/** Rich content block (A+ content) */
export type RichContentBlockType = "text" | "image" | "image_text" | "comparison" | "banner"

export interface RichContentBlock {
  id: string
  type: RichContentBlockType
  title: string
  content: string
  imageUrl?: string
  imagePosition?: "left" | "right"
}

/** Product specification */
export interface ProductSpec {
  id: string
  label: string
  value: string
  group: string
}

/** Product FAQ */
export interface ProductFAQ {
  id: string
  question: string
  answer: string
}

/** SEO data */
export interface ProductSEO {
  metaTitle: string
  metaDescription: string
  urlSlug: string
  canonicalUrl: string
}

/** Google Merchant Centre fields */
export interface MerchantCentreData {
  gtin: string
  mpn: string
  brand: string
  condition: "new" | "refurbished" | "used"
  ageGroup: string
  gender: string
  googleCategory: string
}

/** A product in the list */
export interface Product {
  id: string
  name: string
  sku: string
  category: string
  categoryId: string
  status: ProductStatus
  price: number
  mrp: number
  currency: "INR" | "USD"
  stock: number
  stockLevel: StockLevel
  imageUrl: string
  rating: number
  reviewCount: number
  variantCount: number
  createdAt: string
  updatedAt: string
}

/** Full product detail for the wizard */
export interface ProductDetail extends Product {
  description: string
  shortDescription: string
  variants: ProductVariant[]
  images: ProductImage[]
  richContent: RichContentBlock[]
  specs: ProductSpec[]
  faqs: ProductFAQ[]
  seo: ProductSEO
  merchantCentre: MerchantCentreData
  tags: string[]
  hsnCode: string
  gstRate: number
  /** imageUrl → ["all"] | ["Rose Gold", "Silver", ...] — which variants show this image */
  variantImageMap?: Record<string, string[]>
}

/** Available category for filter/selection */
export interface CategoryOption {
  id: string
  name: string
  parentName: string | null
}

/** Wizard step */
export type WizardStep =
  | "basic"
  | "variants"
  | "images"
  | "rich-content"
  | "specs"
  | "faqs"
  | "seo"
  | "merchant"

/** Bulk action type */
export type BulkAction = "delete" | "activate" | "deactivate" | "export"

/** View mode for product list */
export type ViewMode = "grid" | "table"

/** Filter state */
export interface ProductFilters {
  search: string
  status: ProductStatus | "all"
  category: string
  stockLevel: StockLevel | "all"
}

/** Props for the Product List view */
export interface ProductListProps {
  products: Product[]
  categories: CategoryOption[]
  filters: ProductFilters
  viewMode: ViewMode
  totalCount: number
  isLoading?: boolean

  onChangeViewMode?: (mode: ViewMode) => void
  onChangeFilters?: (filters: Partial<ProductFilters>) => void
  onSearch?: (query: string) => void
  onAddProduct?: () => void
  onEditProduct?: (productId: string) => void
  onDuplicateProduct?: (productId: string) => void
  onDeleteProduct?: (productId: string) => void
  onBulkAction?: (action: BulkAction, productIds: string[]) => void
  onImportCSV?: (file: File) => void
  onExportCSV?: () => void
}

/** Props for the Product Wizard view */
export interface ProductWizardProps {
  product: ProductDetail | null
  categories: CategoryOption[]
  currentStep: WizardStep
  isEditing: boolean

  onStepChange?: (step: WizardStep) => void
  onSaveDraft?: (data: Partial<ProductDetail>) => Promise<void> | void
  onPublish?: (data: Partial<ProductDetail>) => Promise<void> | void
  onCancel?: () => void
  onBack?: () => void
  onUploadFile?: (file: File) => Promise<string>
}

/** Props for the Admin Product Management section */
export interface AdminProductManagementProps {
  products: Product[]
  categories: CategoryOption[]
  editingProduct: ProductDetail | null
  filters: ProductFilters
  viewMode: ViewMode
  totalCount: number
  isLoading?: boolean

  onChangeViewMode?: (mode: ViewMode) => void
  onChangeFilters?: (filters: Partial<ProductFilters>) => void
  onSearch?: (query: string) => void
  onAddProduct?: () => void
  onEditProduct?: (productId: string) => void
  onDuplicateProduct?: (productId: string) => void
  onDeleteProduct?: (productId: string) => void
  onBulkAction?: (action: BulkAction, productIds: string[]) => void
  onImportCSV?: (file: File) => void
  onExportCSV?: () => void
  onSaveDraft?: (data: Partial<ProductDetail>) => Promise<void> | void
  onPublish?: (data: Partial<ProductDetail>) => Promise<void> | void
  onCancelEdit?: () => void
  onUploadFile?: (file: File) => Promise<string>
}
