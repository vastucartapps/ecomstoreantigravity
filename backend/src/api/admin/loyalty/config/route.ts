import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig, mergeMetaConfig } from "../../../lib/store-metadata"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE)
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const config = readMetaConfig(store?.metadata ?? null, "loyalty_config", null)
    res.json({ config })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to read loyalty config" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE)
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    if (!store) {
      res.status(404).json({ message: "Store not found" })
      return
    }

    const loyaltyConfig = req.body
    await storeService.updateStores(store.id, {
      metadata: mergeMetaConfig(store.metadata, "loyalty_config", loyaltyConfig),
    })

    res.json({ config: loyaltyConfig })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to save loyalty config" })
  }
}
