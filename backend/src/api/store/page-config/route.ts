import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const meta = (store?.metadata as any) || {}
    res.json({
      about_config: meta.about_config || null,
      contact_config: meta.contact_config || null,
    })
  } catch {
    res.json({ about_config: null, contact_config: null })
  }
}
