import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Returns active in-app announcements for the storefront.
 * Filters by isActive + date range (startDate/endDate if set).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.notifications_config

    const allAnnouncements: any[] = cfg?.inAppAnnouncements ?? []
    const now = new Date()

    const active = allAnnouncements.filter((a) => {
      if (!a.isActive) return false
      if (a.startDate && new Date(a.startDate) > now) return false
      if (a.endDate && new Date(a.endDate) < now) return false
      return true
    })

    res.json({ announcements: active })
  } catch {
    res.json({ announcements: [] })
  }
}
