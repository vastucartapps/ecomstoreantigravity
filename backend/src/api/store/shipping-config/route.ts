import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

const DEFAULT_CONFIG = {
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

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const config = (store?.metadata as any)?.shipping_config || DEFAULT_CONFIG
    res.json({ config })
  } catch {
    res.json({ config: DEFAULT_CONFIG })
  }
}
