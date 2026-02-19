import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores?.[0]
    const config = (store?.metadata as any)?.social_config || {}
    res.json({ config })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to read social config" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE)
    const stores = await storeService.listStores()
    const store = stores?.[0]
    if (!store) {
      res.status(404).json({ message: "Store not found" })
      return
    }

    const socialConfig = req.body as any
    const existingMetadata = (store.metadata as any) || {}

    await storeService.updateStores(store.id, {
      metadata: { ...existingMetadata, social_config: socialConfig },
    })

    res.json({ config: socialConfig })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to save social config" })
  }
}
