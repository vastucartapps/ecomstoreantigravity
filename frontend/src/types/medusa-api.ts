// Minimal raw Medusa Admin API response interfaces.
// Only covers fields actually accessed by admin hooks — no extra fields.

export interface MedusaAdminUser {
  first_name?: string
  last_name?: string
  email?: string
}

export interface MedusaPayment {
  id?: string
  provider_id?: string
  amount?: number
  captured_at?: string
  data?: Record<string, unknown>
}

export interface MedusaPaymentCollection {
  id?: string
  status?: string
  payments?: MedusaPayment[]
}

export interface MedusaOrderCustomer {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
}

export interface MedusaOrderAddress {
  first_name?: string
  last_name?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  country?: string
  phone?: string
}

export interface MedusaOrderItem {
  id: string
  title?: string
  product_title?: string
  variant_title?: string
  subtitle?: string
  thumbnail?: string
  quantity?: number
  unit_price?: number
  subtotal?: number
}

export interface MedusaFulfillment {
  created_at?: string
  tracking_numbers?: string[]
  tracking_urls?: string[]
}

export interface MedusaOrder {
  id: string
  display_id?: number
  status?: string
  payment_status?: string
  total?: number
  subtotal?: number
  discount_total?: number
  shipping_total?: number
  tax_total?: number
  currency_code?: string
  email?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
  customer?: MedusaOrderCustomer
  customer_id?: string
  items?: MedusaOrderItem[]
  payment_collections?: MedusaPaymentCollection[]
  shipping_address?: MedusaOrderAddress
  fulfillments?: MedusaFulfillment[]
}

export interface MedusaCustomerAddress {
  id: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
  phone?: string
  metadata?: Record<string, unknown>
}

export interface MedusaCustomer {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  created_at?: string
  metadata?: Record<string, unknown>
  addresses?: MedusaCustomerAddress[]
}

export interface MedusaBooking {
  id: string
  customer_id?: string
  title?: string
  date?: string
  time?: string
  status?: string
  meeting_link?: string | null
  notes?: string
}

export interface MedusaPromotionRule {
  attribute?: string
  operator?: string
  values?: string[]
}

export interface MedusaApplicationMethod {
  type?: string
  value?: number
  currency_code?: string
}

export interface MedusaPromotion {
  id: string
  code?: string
  status?: string
  usage_count?: number
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
  application_method?: MedusaApplicationMethod
  rules?: MedusaPromotionRule[]
}

export interface MedusaGiftCard {
  id: string
  code?: string
  value?: number
  balance?: number
  is_disabled?: boolean
  ends_at?: string | null
  created_at?: string
  currency_code?: string
  metadata?: Record<string, unknown>
}

export interface MedusaProductVariant {
  id?: string
  inventory_quantity?: number
  title?: string
  sku?: string
}

export interface MedusaProduct {
  id: string
  title?: string
  handle?: string
  metadata?: Record<string, unknown>
  variants?: MedusaProductVariant[]
}

export interface MedusaReturn {
  id: string
}
