import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Returns only PUBLIC payment gateway config (key IDs, never secrets).
// The admin panel saves keys via store.metadata.payments_tax_config.gateways;
// the checkout reads them back here so the admin UI is the single source of truth.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const gateways = (store?.metadata as any)?.payments_tax_config?.gateways

    res.json({
      razorpay_key_id: gateways?.razorpay?.keyId || null,
      stripe_publishable_key: gateways?.stripe?.publishableKey || null,
      paypal_client_id: gateways?.paypal?.clientId || null,
    })
  } catch {
    res.json({ razorpay_key_id: null, stripe_publishable_key: null, paypal_client_id: null })
  }
}
