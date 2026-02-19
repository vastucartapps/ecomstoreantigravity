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

export interface AdminShippingProps {
  config: ShippingConfig
  isLoading?: boolean
  onSaveZones: (zones: ShippingZone[]) => Promise<void>
  onSaveFreeShipping: (config: FreeShippingConfig) => Promise<void>
  onSaveCOD: (config: CODConfig) => Promise<void>
  onSaveDeliveryEstimates: (estimates: DeliveryEstimate[]) => Promise<void>
  onSaveShippingPolicy: (content: string) => Promise<void>
}
