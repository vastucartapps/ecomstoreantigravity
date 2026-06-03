import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const config = (store?.metadata as any)?.storefront_config || null
    // Public feature flag for the storefront: loyalty on/off (admin SSoT in
    // store.metadata.loyalty_config.programEnabled). Defaults on when unset.
    const loyaltyCfg = (store?.metadata as any)?.loyalty_config
    const loyaltyEnabled = loyaltyCfg ? loyaltyCfg.programEnabled !== false : true
    res.json({ config, loyaltyEnabled })
  } catch {
    res.json({ config: null, loyaltyEnabled: true })
  }
}
