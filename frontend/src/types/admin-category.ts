/** Category status */
export type CategoryStatus = "active" | "inactive"

/** Google Merchant / Shopping fields for a category */
export interface CategoryGoogleMerchant {
  googleProductCategory: string // Google taxonomy ID or name e.g. "2271" or "Apparel & Accessories"
  customLabel0: string
  customLabel1: string
  customLabel2: string
  customLabel3: string
  customLabel4: string
}

/** A category node in the hierarchy tree */
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  parentId: string | null
  parentName: string | null
  status: CategoryStatus
  productCount: number
  displayOrder: number
  children: Category[]
  seo: {
    metaTitle: string
    metaDescription: string
  }
  googleMerchant: CategoryGoogleMerchant
  createdAt: string
  updatedAt: string
}

/** Flat category option for parent dropdown (depth-aware) */
export interface CategoryOption {
  id: string
  name: string
  depth: number
}

/** Props for the Category Tree panel */
export interface CategoryTreeProps {
  categories: Category[]
  selectedCategoryId: string | null
  onSelectCategory?: (categoryId: string) => void
  onToggleStatus?: (categoryId: string) => void
  onReorder?: (categoryId: string, newOrder: number) => void
  onAddCategory?: () => void
}

/** Props for the Category Detail panel */
export interface CategoryDetailProps {
  category: Category | null
  parentOptions: CategoryOption[]
  onEdit?: (category: Category) => void
  onDelete?: (categoryId: string, reassignToId?: string) => void
  onToggleStatus?: (categoryId: string) => void
}

/** Props for the Category Form (full page) */
export interface CategoryFormProps {
  category: Category | null
  parentOptions: CategoryOption[]
  isEditing: boolean
  onSave?: (data: Partial<Category>) => Promise<void> | void
  onCancel?: () => void
  onImageUpload?: (file: File) => Promise<string>
}

/** Props for the Admin Category Management section */
export interface AdminCategoryManagementProps {
  categories: Category[]
  parentOptions: CategoryOption[]
  selectedCategoryId: string | null
  editingCategory: Category | null
  isLoading?: boolean

  onSelectCategory?: (categoryId: string) => void
  onAddCategory?: () => void
  onEditCategory?: (category: Category) => void
  onDeleteCategory?: (categoryId: string, reassignToId?: string) => void
  onToggleStatus?: (categoryId: string) => void
  onReorder?: (categoryId: string, newOrder: number) => void
  onSaveCategory?: (data: Partial<Category>) => Promise<void> | void
  onCancelEdit?: () => void
  onImageUpload?: (file: File) => Promise<string>
}
