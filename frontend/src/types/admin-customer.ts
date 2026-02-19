/** Customer segment */
export type CustomerSegment = "new" | "repeat" | "inactive" | "high_value"

/** A customer row in the list table */
export interface CustomerRow {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  totalOrders: number
  lifetimeValue: number
  currency: "INR" | "USD"
  segments: CustomerSegment[]
  joinedAt: string
}

/** Customer order summary */
export interface CustomerOrder {
  id: string
  orderNumber: string
  total: number
  currency: "INR" | "USD"
  status: string
  date: string
  itemCount: number
}

/** Customer address */
export interface CustomerAddress {
  id: string
  label: "Home" | "Office" | "Other"
  street: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

/** Customer review */
export interface CustomerReview {
  id: string
  productName: string
  productImageUrl: string
  rating: number
  excerpt: string
  date: string
}

/** Admin note */
export interface AdminNote {
  id: string
  author: string
  message: string
  createdAt: string
}

/** Full customer detail */
export interface CustomerDetail {
  id: string
  name: string
  email: string
  emailVerified: boolean
  phone: string
  avatarUrl: string
  joinedAt: string
  lastOrderAt: string | null
  totalOrders: number
  lifetimeValue: number
  averageOrderValue: number
  currency: "INR" | "USD"
  loyaltyPoints: number
  segments: CustomerSegment[]
  recentOrders: CustomerOrder[]
  addresses: CustomerAddress[]
  reviews: CustomerReview[]
  notes: AdminNote[]
}

/** Filter state */
export interface CustomerFilters {
  search: string
  segment: CustomerSegment | "all"
  sortField: "name" | "totalOrders" | "lifetimeValue" | "joinedAt"
  sortDirection: "asc" | "desc"
}

/** Props for the Customer List */
export interface CustomerListProps {
  customers: CustomerRow[]
  filters: CustomerFilters
  totalCount: number
  onChangeFilters?: (filters: Partial<CustomerFilters>) => void
  onViewCustomer?: (customerId: string) => void
}

/** Props for the Customer Detail page */
export interface CustomerDetailPageProps {
  customer: CustomerDetail
  onBack?: () => void
  onViewOrder?: (orderId: string) => void
  onAddNote?: (customerId: string, message: string) => void
}

/** Props for the Admin Customer Management section */
export interface AdminCustomerManagementProps {
  customers: CustomerRow[]
  customerDetail: CustomerDetail | null
  filters: CustomerFilters
  totalCount: number
  isLoading?: boolean
  isDetailLoading?: boolean
  onChangeFilters?: (filters: Partial<CustomerFilters>) => void
  onViewCustomer?: (customerId: string) => void
  onViewOrder?: (orderId: string) => void
  onAddNote?: (customerId: string, message: string) => void
  onBackToList?: () => void
}
