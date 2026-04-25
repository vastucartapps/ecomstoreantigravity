import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// Returns PUBLIC payment + tax config: gateway key IDs (never secrets),
// plus GSTIN and seller state which appear on every invoice/receipt and
// are public business identifiers. Admin panel saves keys via
// store.metadata.payments_tax_config; this is the single read path
// downstream consumers use, so admin edits propagate everywhere.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const config = (store?.metadata as any)?.payments_tax_config
    const gateways = config?.gateways
    const gst = config?.gstConfig

    res.json({
      razorpay_key_id: gateways?.razorpay?.keyId || null,
      stripe_publishable_key: gateways?.stripe?.publishableKey || null,
      paypal_client_id: gateways?.paypal?.clientId || null,
      gstin: gst?.gstin || null,
      seller_state: gst?.sellerState || null,
      default_gst_rate: gst?.defaultRate ?? null,
      default_hsn: gst?.defaultHSN || null,
      legal_name: gst?.legalName || null,
      registered_address: gst?.registeredAddress || null,
    })
  } catch {
    res.json({
      razorpay_key_id: null,
      stripe_publishable_key: null,
      paypal_client_id: null,
      gstin: null,
      seller_state: null,
      default_gst_rate: null,
      default_hsn: null,
      legal_name: null,
      registered_address: null,
    })
  }
}
