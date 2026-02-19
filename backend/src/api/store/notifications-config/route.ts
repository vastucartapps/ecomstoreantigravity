import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public-safe notifications config for the storefront.
 * Returns only push vapid public key (from env) and whether each channel is enabled.
 * Never returns SMS keys, Twilio SIDs, or WhatsApp tokens.
 */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = _req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.notifications_config ?? {}

    res.json({
      pushEnabled: cfg.pushConfig?.isEnabled ?? false,
      smsEnabled: cfg.smsConfig?.isEnabled ?? false,
      whatsappEnabled: cfg.whatsappConfig?.isEnabled ?? false,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? null,
    })
  } catch {
    res.json({
      pushEnabled: false,
      smsEnabled: false,
      whatsappEnabled: false,
      vapidPublicKey: null,
    })
  }
}
