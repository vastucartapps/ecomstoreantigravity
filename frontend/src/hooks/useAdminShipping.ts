import { medusa, adminFetch } from "@/lib/medusa"
import type {
  ShippingConfig,
  ShippingZone,
  FreeShippingConfig,
  CODConfig,
  DeliveryEstimate,
} from "@/types/admin-shipping"

const DEFAULT_CONFIG: ShippingConfig = {
  zones: [
    { id: "zone-domestic", name: "Domestic (India)", rate: 49, currency: "INR", isEnabled: true },
    { id: "zone-international", name: "International", rate: 15, currency: "USD", isEnabled: true },
  ],
  freeShipping: { enabled: true, thresholdINR: 999, thresholdUSD: 50 },
  cod: { enabled: true, fee: 0, minOrder: 500, maxOrder: 25000 },
  deliveryEstimates: [
    { id: "de-metro", region: "Metro Cities", pincodePrefix: "1,2,4,5,6", minDays: 3, maxDays: 5 },
    { id: "de-standard", region: "Rest of India", pincodePrefix: "", minDays: 7, maxDays: 10 },
    { id: "de-express", region: "Express (All India)", pincodePrefix: "", minDays: 2, maxDays: 4 },
    { id: "de-international", region: "International", pincodePrefix: "", minDays: 15, maxDays: 30 },
  ],
  shippingPolicy:
    "# Shipping Policy\n\nWe ship across India and internationally. All domestic orders are processed within 1–2 business days.\n\n## Domestic Shipping\n\n- Standard: 7–10 business days\n- Express: 4–7 business days\n\n## International Shipping\n\n- Standard: 15–30 business days\n- Express: 10–20 business days\n\n## Free Shipping\n\nFree shipping on all domestic orders above ₹999.\n\n## Cash on Delivery\n\nCOD is available for Indian orders between ₹500 and ₹25,000.",
}

async function readStore(): Promise<{ id: string; config: ShippingConfig; rawMetadata: Record<string, unknown> }> {
  const res = await adminFetch<{ stores: Array<{ id: string; metadata?: Record<string, unknown> }> }>("/admin/stores")
  const store = res.stores?.[0]
  const rawMetadata: Record<string, unknown> = store?.metadata ?? {}
  const config: ShippingConfig = (rawMetadata.shipping_config as ShippingConfig) || DEFAULT_CONFIG
  return { id: store?.id || "", config, rawMetadata }
}

async function writeConfig(storeId: string, config: ShippingConfig, rawMetadata: Record<string, unknown>): Promise<void> {
  await medusa.client.fetch(`/admin/stores/${storeId}`, {
    method: "POST",
    body: { metadata: { ...rawMetadata, shipping_config: config } },
  })
}

export function useAdminShipping() {
  async function fetchShippingConfig(): Promise<ShippingConfig> {
    const { config } = await readStore()
    return config
  }

  async function saveZones(zones: ShippingZone[]): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, zones }, rawMetadata)
  }

  async function saveFreeShipping(freeShipping: FreeShippingConfig): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, freeShipping }, rawMetadata)
  }

  async function saveCOD(cod: CODConfig): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, cod }, rawMetadata)
  }

  async function saveDeliveryEstimates(
    deliveryEstimates: DeliveryEstimate[]
  ): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, deliveryEstimates }, rawMetadata)
  }

  async function saveShippingPolicy(shippingPolicy: string): Promise<void> {
    const { id, config, rawMetadata } = await readStore()
    await writeConfig(id, { ...config, shippingPolicy }, rawMetadata)
  }

  return {
    fetchShippingConfig,
    saveZones,
    saveFreeShipping,
    saveCOD,
    saveDeliveryEstimates,
    saveShippingPolicy,
  }
}
