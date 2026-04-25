export type PaymentMode = "test" | "live"

export interface GatewayConfig {
  razorpay: { keyId: string; keySecret: string; isConnected: boolean }
  stripe: { publishableKey: string; secretKey: string; isConnected: boolean }
}

export interface PaymentMethodToggle {
  id: string
  name: string
  icon: string
  enabled: boolean
  description: string
}

export type TaxTab = "gst" | "international" | "per-product"

export interface GSTConfig {
  gstin: string
  defaultRate: number
  defaultHSN: string
  /** Seller's registered legal entity name as it appears on tax filings.
   *  E.g. "Prashant Kumar, Sole Proprietor". Used in invoice header and
   *  legal page boilerplate ("VastuCart is operated by ...") via the
   *  {{legalName}} template variable. */
  legalName?: string
  /** Seller's registered legal address per GSTIN registration. Different
   *  from branding.streetAddress (which is the customer-facing/operational
   *  address). Used in legal pages via the {{registeredAddress}} template
   *  variable. E.g. "VastuCart Premiere Enc, HN 2, Via Udaipurwati,
   *  Jhunjhunu, Rajasthan – 333307". */
  registeredAddress?: string
  /** State of registration — drives intra/inter-state GST split. ISO 3166-2
   *  Indian state code or full name. */
  sellerState?: string
}

export interface InternationalTaxConfig {
  taxExempt: boolean
  lutNumber: string
}

export interface ProductTaxOverride {
  productId: string
  productName: string
  sku: string
  gstRate: number
  hsnCode: string
}

export interface PaymentsTaxConfig {
  mode: PaymentMode
  gateways: GatewayConfig
  paymentMethods: PaymentMethodToggle[]
  gstConfig: GSTConfig
  internationalTax: InternationalTaxConfig
}

export interface AdminPaymentsTaxProps {
  mode: PaymentMode
  gateways: GatewayConfig
  paymentMethods: PaymentMethodToggle[]
  gstConfig: GSTConfig
  internationalTax: InternationalTaxConfig
  productOverrides: ProductTaxOverride[]
  activeTaxTab: TaxTab

  onToggleMode?: (mode: PaymentMode) => Promise<void>
  onSaveGateways?: (gateways: GatewayConfig) => Promise<void>
  onTestConnection?: (
    gateway: "razorpay" | "stripe",
    gateways: GatewayConfig
  ) => Promise<{ connected: boolean; error?: string }>
  onTogglePaymentMethod?: (methodId: string) => Promise<void>
  onChangeTaxTab?: (tab: TaxTab) => void
  onSaveGST?: (config: GSTConfig) => Promise<void>
  onSaveInternationalTax?: (config: InternationalTaxConfig) => Promise<void>
  onSaveProductOverride?: (override: ProductTaxOverride) => Promise<void>
}
