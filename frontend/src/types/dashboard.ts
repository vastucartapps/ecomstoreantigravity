export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  memberSince: string
  currency: "INR" | "USD"
  emailVerified: boolean
}

export interface DashboardStats {
  totalOrders: number
  totalSpent: number
  wishlistCount: number
  loyaltyBalance: number
  activeCouponsCount: number
}

export interface OrderItem {
  id: string
  productTitle: string
  variantTitle?: string
  thumbnail?: string
  quantity: number
  unitPrice: number
  total: number
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export interface OrderTimelineStep {
  label: string
  date?: string
  completed: boolean
  current: boolean
}

export interface Order {
  id: string
  orderNumber: string
  orderDate: string
  status: OrderStatus
  items: OrderItem[]
  itemCount: number
  total: number
  currency: string
  paymentMethod?: string
  shippingAddress?: string
  trackingNumber?: string
  timeline: OrderTimelineStep[]
}

export interface Address {
  id: string
  name: string
  phone?: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
  label?: string
}

export interface WishlistItem {
  id: string
  productId: string
  variantId?: string
  title: string
  thumbnail?: string
  price: number
  handle: string
  inStock: boolean
}

export interface Coupon {
  id: string
  code: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minOrderValue?: number
  expiresAt?: string
  isActive: boolean
}

export interface LoyaltyTransaction {
  id: string
  points: number
  type: "earned" | "redeemed" | "adjusted"
  description: string
  balance_after: number
  created_at: string
}

export interface LoyaltyBalance {
  balance: number
  transactions: LoyaltyTransaction[]
}

export interface Booking {
  id: string
  title: string
  consultant_name: string
  date: string
  time: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  meeting_link: string
  price: number
  currency: string
  notes: string
  created_at: string
}

export interface GiftCard {
  id: string
  code: string
  balance: number
  currency: string
  expiresAt?: string
}

export interface CustomerNotification {
  id: string
  type: "order" | "promotion" | "stock" | "loyalty"
  title: string
  message: string
  link: string
  is_read: boolean
  created_at: string
}

export interface SupportInfo {
  email: string
  phone: string
  hours: string
  whatsapp?: string
  chatwootToken?: string
}
