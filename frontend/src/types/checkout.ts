/** Cart line item mapped for display */
export interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  variantId: string
  variantLabel: string
  imageUrl: string
  price: number
  mrp: number
  currency: "INR" | "USD"
  quantity: number
  maxQuantity: number
  inStock: boolean
}

/** Coupon from promotions API */
export interface Coupon {
  id: string
  code: string
  description: string
  discountType: "percentage" | "flat"
  discountValue: number
  maxDiscount: number | null
  minOrderValue: number
  currency: "INR" | "USD"
  validUntil: string
  isApplicable: boolean
}

/** Applied coupon summary */
export interface AppliedCoupon {
  code: string
  discountAmount: number
  description: string
}

/** Saved address */
export interface SavedAddress {
  id: string
  name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
  label: "Home" | "Office" | "Other"
}

/** Address payload for Medusa API */
export interface AddressPayload {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone?: string
  company?: string
}

/** Shipping option from Medusa */
export interface ShippingOption {
  id: string
  name: string
  amount: number
  currency_code: string
  provider_id: string
}

/** COD configuration */
export interface CodConfig {
  available: boolean
  fee: number
  currency: "INR" | "USD"
  minOrder: number
  maxOrder: number
  label: string
  feeLabel: string
}

/** Prepaid discount config */
export interface PrepaidDiscount {
  enabled: boolean
  percentage: number
  maxDiscount: number
  label: string
}

/** Order summary computed from cart */
export interface OrderSummaryData {
  subtotal: number
  mrpTotal: number
  totalSavings: number
  couponDiscount: number
  shippingFee: number
  codFee: number
  taxAmount: number
  grandTotal: number
  currency: "INR" | "USD"
  itemCount: number
}

/** Contact info captured at checkout step 1 */
export interface ContactInfo {
  email: string
  phone: string
  countryCode: string
  isIndian: boolean
}

/** Checkout step state */
export type CheckoutStepId = "contact" | "address" | "shipping" | "payment"
export type CheckoutStepStatus = "completed" | "active" | "upcoming"

export interface CheckoutStep {
  id: CheckoutStepId
  label: string
  status: CheckoutStepStatus
}

/** Order confirmation after successful payment */
export interface OrderConfirmationData {
  orderId: string
  orderDate: string
  estimatedDelivery: string
  paymentMethod: string
  totalPaid: number
  currency: "INR" | "USD"
  email: string
  phone: string
  shippingAddress: string
  items: OrderConfirmationItem[]
}

export interface OrderConfirmationItem {
  id: string
  name: string
  thumbnail: string
  quantity: number
  unitPrice: number
  total: number
  variant: string
}

/** GST invoice data */
export interface GSTInvoiceData {
  invoiceNumber: string
  orderDate: string
  orderId: string
  customerName: string
  customerAddress: string
  customerState: string
  sellerState: string
  sellerGSTIN: string
  sellerName: string
  sellerAddress: string
  items: InvoiceLineItem[]
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  shippingCharge: number
  total: number
  totalInWords: string
  currencyCode: string
}

export interface InvoiceLineItem {
  name: string
  hsn: string
  quantity: number
  rate: number
  taxableValue: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  igstRate: number
  igstAmount: number
  total: number
}

/** Empty cart state */
export interface EmptyCartState {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}
