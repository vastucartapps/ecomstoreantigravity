/** Order status */
export type OrderStatus =
  | "processing"
  | "accepted"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"

/** Payment method */
export type PaymentMethod =
  | "razorpay"
  | "stripe"
  | "cod"
  | "upi"
  | "netbanking"
  | "wallet"

/** Payment status */
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded"

/** Date range preset */
export type DatePreset = "all" | "today" | "7days" | "30days" | "custom"

/** Sort field */
export type OrderSortField = "date" | "total" | "status" | "customer"

/** Sort direction */
export type SortDirection = "asc" | "desc"

/** An order item */
export interface OrderItem {
  id: string
  productName: string
  variantLabel: string
  imageUrl: string
  quantity: number
  price: number
  lineTotal: number
  currency: "INR" | "USD"
}

/** A timeline event */
export interface TimelineEvent {
  id: string
  status: OrderStatus
  label: string
  timestamp: string | null
  note: string | null
  isCompleted: boolean
  isCurrent: boolean
}

/** An internal note */
export interface OrderNote {
  id: string
  author: string
  message: string
  createdAt: string
}

/** Customer info for order */
export interface OrderCustomer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
}

/** Shipping address */
export interface ShippingAddress {
  name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
}

/** Payment details */
export interface PaymentDetails {
  method: PaymentMethod
  status: PaymentStatus
  transactionId: string
  amount: number
  currency: "INR" | "USD"
  paidAt: string | null
}

/** An order in the list table */
export interface OrderRow {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  itemCount: number
  total: number
  currency: "INR" | "USD"
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  date: string
}

/** Full order detail */
export interface OrderDetail {
  id: string
  orderNumber: string
  status: OrderStatus
  customer: OrderCustomer
  shippingAddress: ShippingAddress
  payment: PaymentDetails
  items: OrderItem[]
  timeline: TimelineEvent[]
  notes: OrderNote[]
  subtotal: number
  discount: number
  shippingFee: number
  tax: number
  total: number
  currency: "INR" | "USD"
  trackingNumber: string | null
  trackingUrl: string | null
  carrier: string | null
  createdAt: string
  updatedAt: string
}

/** Filter state */
export interface OrderFilters {
  search: string
  status: OrderStatus | "all"
  datePreset: DatePreset
  dateFrom: string
  dateTo: string
  sortField: OrderSortField
  sortDirection: SortDirection
}

/** Pagination state */
export interface Pagination {
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

/** Keyset cursor pagination state */
export interface CursorPagination {
  limit: number                      // rows per page
  cursor: string | null              // created_at[lt] param for current page (null = page 1)
  prevCursors: Array<string | null>  // stack of previous page cursors for back navigation
  nextCursor: string | null          // cursor for next page (null if no more pages)
  hasMore: boolean                   // true if a next page exists
  pageNum: number                    // 1-based display number
  totalCount: number                 // cached from initial count query
}

/** Props for the Orders Table */
export interface OrdersTableProps {
  orders: OrderRow[]
  filters: OrderFilters
  cursorPag: CursorPagination
  isLoading?: boolean
  onChangeFilters?: (filters: Partial<OrderFilters>) => void
  onNextPage?: () => void
  onPrevPage?: () => void
  onChangeLimit?: (limit: number) => void
  onViewOrder?: (orderId: string) => void
  onDownloadInvoice?: (orderId: string) => void
}

/** Props for the Order Detail page */
export interface OrderDetailPageProps {
  order: OrderDetail
  onBack?: () => void
  onUpdateStatus?: (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    carrier?: string
  ) => void
  onAddNote?: (orderId: string, message: string) => void
  onDownloadInvoice?: (orderId: string) => void
  onEmailCustomer?: (orderId: string) => void
}

/** Props for the Admin Order Management section */
export interface AdminOrderManagementProps {
  orders: OrderRow[]
  orderDetail: OrderDetail | null
  filters: OrderFilters
  cursorPag: CursorPagination
  isLoading?: boolean
  isDetailLoading?: boolean
  onChangeFilters?: (filters: Partial<OrderFilters>) => void
  onNextPage?: () => void
  onPrevPage?: () => void
  onChangeLimit?: (limit: number) => void
  onViewOrder?: (orderId: string) => void
  onUpdateStatus?: (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    carrier?: string
  ) => void
  onAddNote?: (orderId: string, message: string) => void
  onDownloadInvoice?: (orderId: string) => void
  onEmailCustomer?: (orderId: string) => void
  onBackToList?: () => void
}
