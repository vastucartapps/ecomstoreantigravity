import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig } from "./store-metadata"

/**
 * Whether the loyalty program is enabled system-wide.
 *
 * Single source of truth: store.metadata.loyalty_config.programEnabled, set
 * from Admin → Loyalty. Defaults to true when no config has been saved (matches
 * the order-loyalty subscriber's behaviour). Every loyalty consumer (store
 * balance/redeem routes, storefront flag) reads through this so the admin toggle
 * takes effect everywhere in real time.
 */
export async function isLoyaltyEnabled(scope: {
  resolve: (key: string) => any
}): Promise<boolean> {
  try {
    const storeService = scope.resolve(Modules.STORE)
    const stores = await storeService.listStores({}, { take: 1 })
    const cfg = readMetaConfig<{ programEnabled?: boolean } | null>(
      stores?.[0]?.metadata ?? null,
      "loyalty_config",
      null
    )
    return cfg ? cfg.programEnabled !== false : true
  } catch {
    return true
  }
}
