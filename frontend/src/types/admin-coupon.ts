export type CouponStatus = "active" | "expired" | "disabled"
export type DiscountType = "percentage" | "fixed"
export type GiftCardStatus = "active" | "inactive" | "expired" | "depleted"
export type CustomerEligibility = "all" | "new_customers"
export type CouponsGiftCardsTab = "coupons" | "gift-cards"

export interface CurrencyValue {
  INR: number
  USD: number
}

export interface CouponRow {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrder: number | null
  maxDiscount: number | null
  currency: "INR" | "USD"
  startDate: string
  endDate: string
  usageLimit: number | null
  usageLimitPerCustomer: number
  usedCount: number
  status: CouponStatus
  targetType: "all" | "products" | "categories"
  targetNames: string[]
  customerEligibility: CustomerEligibility
}

export interface CouponDetail extends CouponRow {
  description: string
  currencyValues: CurrencyValue
  targetProductIds: string[]
  targetCategoryIds: string[]
  createdAt: string
  updatedAt: string
}

export interface GiftCardRow {
  id: string
  code: string
  initialBalance: number
  currentBalance: number
  currency: "INR" | "USD"
  status: GiftCardStatus
  expiresAt: string | null
  createdAt: string
}

export interface GiftCardTransaction {
  id: string
  type: "credit" | "debit"
  amount: number
  currency: "INR" | "USD"
  description: string
  orderId: string | null
  date: string
}

export interface GiftCardDetail extends GiftCardRow {
  transactions: GiftCardTransaction[]
  customerName: string | null
  customerEmail: string | null
}

export interface AdminCouponsGiftCardsProps {
  coupons: CouponRow[]
  giftCards: GiftCardRow[]
  editingCoupon: CouponDetail | null
  giftCardDetail: GiftCardDetail | null
  activeTab: CouponsGiftCardsTab
  couponStatusFilter: CouponStatus | "all"
  searchQuery: string
  isLoading?: boolean
  isSaving?: boolean
  categories?: { id: string; name: string }[]

  onChangeTab?: (tab: CouponsGiftCardsTab) => void
  onChangeCouponStatus?: (status: CouponStatus | "all") => void
  onSearch?: (query: string) => void
  onCreateCoupon?: () => void
  onEditCoupon?: (couponId: string) => void
  onDeleteCoupon?: (couponId: string) => Promise<void>
  onToggleCoupon?: (couponId: string) => Promise<void>
  onSaveCoupon?: (data: Partial<CouponDetail>) => Promise<void>
  onCancelCouponEdit?: () => void
  onCreateGiftCard?: (
    balance: number,
    currency: "INR" | "USD",
    expiresAt?: string,
    code?: string
  ) => Promise<void>
  onViewGiftCard?: (giftCardId: string) => void
  onToggleGiftCard?: (giftCardId: string) => Promise<void>
  onBackFromGiftCard?: () => void
  onViewOrder?: (orderId: string) => void
  onSearchProducts?: (query: string) => Promise<{ id: string; title: string }[]>
}
