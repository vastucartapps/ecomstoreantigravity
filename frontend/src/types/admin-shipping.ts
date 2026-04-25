export interface ShippingZone {
  id: string
  name: string
  rate: number
  currency: "INR" | "USD"
  isEnabled: boolean
}

export interface FreeShippingConfig {
  enabled: boolean
  thresholdINR: number
  thresholdUSD: number
}

export interface CODConfig {
  enabled: boolean
  fee: number
  minOrder: number
  maxOrder: number
}

export interface DeliveryEstimate {
  id: string
  region: string
  pincodePrefix: string
  minDays: number
  maxDays: number
}

export interface ShippingConfig {
  zones: ShippingZone[]
  freeShipping: FreeShippingConfig
  cod: CODConfig
  deliveryEstimates: DeliveryEstimate[]
  shippingPolicy: string
}

/**
 * Post-purchase return rules — single source of truth for the return window
 * shown in the footer trust ribbon, homepage trust badge, and refund-policy
 * legal page. Editing these values here propagates to every consumer.
 */
export interface ReturnPolicy {
  /** Days from delivery during which a return can be raised. Drives
   *  trust-ribbon "X-Day Returns" copy and refund-policy legal text. */
  windowDays: number
  /** Days after VastuCart receives the returned item to inspect it.
   *  Free-form string to allow ranges (e.g. "3-5"). */
  inspectionDays: string
  /** Business-day range for refund processing once approved (e.g. "7-10"). */
  refundDays: string
  /** Whether unboxing video is required (per current policy). */
  unboxingVideoRequired: boolean
}

export interface AdminShippingProps {
  config: ShippingConfig
  returnPolicy: ReturnPolicy
  isLoading?: boolean
  onSaveZones: (zones: ShippingZone[]) => Promise<void>
  onSaveFreeShipping: (config: FreeShippingConfig) => Promise<void>
  onSaveCOD: (config: CODConfig) => Promise<void>
  onSaveDeliveryEstimates: (estimates: DeliveryEstimate[]) => Promise<void>
  onSaveShippingPolicy: (content: string) => Promise<void>
  onSaveReturnPolicy: (policy: ReturnPolicy) => Promise<void>
}
