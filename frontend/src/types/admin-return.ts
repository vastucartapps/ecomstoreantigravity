/** Return request status */
export type ReturnStatus = 'pending' | 'under_review' | 'approved' | 'refunded' | 'rejected'

/** Refund type */
export type RefundType = 'full' | 'partial'

/** Refund method */
export type RefundMethod = 'original_payment' | 'store_credit'

/** Return reason */
export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'changed_mind'
  | 'size_issue'
  | 'damaged_in_transit'
  | 'other'

/** A return request card for the Kanban board */
export interface ReturnCard {
  id: string
  orderNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  productName: string
  productImageUrl: string
  variantLabel: string
  reason: ReturnReason
  status: ReturnStatus
  refundAmount: number
  currency: 'INR' | 'USD'
  requestedAt: string
  daysOpen: number
}

/** Customer-uploaded return photo */
export interface ReturnPhoto {
  id: string
  url: string
  caption: string
}

/** Timeline event for a return */
export interface ReturnTimelineEvent {
  id: string
  action: string
  author: string
  note: string | null
  timestamp: string
}

/** Full return detail */
export interface ReturnDetail {
  id: string
  orderNumber: string
  orderId: string
  status: ReturnStatus
  customer: {
    id: string
    name: string
    email: string
    phone: string
  }
  product: {
    id: string
    name: string
    variantLabel: string
    imageUrl: string
    quantity: number
    price: number
    currency: 'INR' | 'USD'
  }
  returnItemIds: string[]
  paymentCollectionId: string | null
  reason: ReturnReason
  customerNotes: string
  photos: ReturnPhoto[]
  adminNotes: string
  refundType: RefundType | null
  refundAmount: number
  refundMethod: RefundMethod | null
  isWithinReturnWindow: boolean
  returnWindowDays: number
  timeline: ReturnTimelineEvent[]
  requestedAt: string
  resolvedAt: string | null
}

/** Props for the Returns Kanban board */
export interface ReturnsKanbanProps {
  returns: ReturnCard[]
  isLoading?: boolean
  onViewReturn?: (returnId: string) => void
  onMoveReturn?: (returnId: string, newStatus: ReturnStatus) => void
  onSearch?: (query: string) => void
}

/** Props for the Return Detail page */
export interface ReturnDetailPageProps {
  returnRequest: ReturnDetail
  onBack?: () => void
  onApprove?: (returnId: string, notes: string) => Promise<void>
  onReject?: (returnId: string, notes: string) => Promise<void>
  onProcessRefund?: (returnId: string, type: RefundType, amount: number, method: RefundMethod) => Promise<{ success: boolean; giftCardCode?: string }>
  onInitiateExchange?: (returnId: string) => Promise<void>
}

/** Props for the Admin Returns & Refunds section */
export interface AdminReturnsRefundsProps {
  returns: ReturnCard[]
  returnDetail: ReturnDetail | null
  isLoading?: boolean
  isDetailLoading?: boolean
  onViewReturn?: (returnId: string) => void
  onMoveReturn?: (returnId: string, newStatus: ReturnStatus) => void
  onSearch?: (query: string) => void
  onApprove?: (returnId: string, notes: string) => Promise<void>
  onReject?: (returnId: string, notes: string) => Promise<void>
  onProcessRefund?: (returnId: string, type: RefundType, amount: number, method: RefundMethod) => Promise<{ success: boolean; giftCardCode?: string }>
  onInitiateExchange?: (returnId: string) => Promise<void>
  onBackToBoard?: () => void
}
