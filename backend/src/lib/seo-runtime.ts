import { randomBytes } from "crypto"
import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig, mergeMetaConfig } from "./store-metadata"

/**
 * SEO runtime config — lives in the admin system (store.metadata.seo_runtime),
 * NOT env vars. Currently holds the IndexNow verification key, auto-generated
 * once on first use and persisted, so there is no env var and no hardcoded
 * default to leak or rotate by hand. The storefront serves this key at
 * /indexnow-key.txt and the backend submits it when pinging IndexNow.
 *
 * (The on-demand revalidation webhook needs NO secret — it is secured by
 * network isolation: the backend calls the frontend over the internal docker
 * network and the frontend rejects any proxied/external request.)
 */
export interface SeoRuntime {
  indexnowKey: string
}

const META_KEY = "seo_runtime"

export async function getSeoRuntime(scope: {
  resolve: (k: string) => any
}): Promise<SeoRuntime> {
  const storeService = scope.resolve(Modules.STORE)
  const stores = await storeService.listStores({}, { take: 1 })
  const store = stores?.[0]
  const existing = readMetaConfig<Partial<SeoRuntime> | null>(
    store?.metadata ?? null,
    META_KEY,
    null
  )

  if (existing?.indexnowKey) {
    return { indexnowKey: existing.indexnowKey }
  }

  // First use — generate + persist. IndexNow keys are 8-128 hex chars.
  const indexnowKey = randomBytes(16).toString("hex")
  if (store) {
    try {
      await storeService.updateStores(store.id, {
        metadata: mergeMetaConfig(store.metadata ?? null, META_KEY, {
          ...(existing || {}),
          indexnowKey,
        }),
      })
    } catch {
      // If persistence fails we still return the generated key for this run;
      // a later run will persist it. IndexNow tolerates key changes.
    }
  }
  return { indexnowKey }
}
