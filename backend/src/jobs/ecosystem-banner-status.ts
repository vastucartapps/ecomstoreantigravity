import type { MedusaContainer } from "@medusajs/framework/types"
import { ECOSYSTEM_ADS_MODULE } from "../modules/ecosystem-ads"

export default async function ecosystemBannerStatusJob(
  container: MedusaContainer
) {
  const adsService = container.resolve(ECOSYSTEM_ADS_MODULE) as any
  const updated = await adsService.updateBannerStatuses()
  if (updated > 0) {
    console.log(`[ecosystem-banner-status] Updated ${updated} banner statuses`)
  }
}

export const config = {
  name: "ecosystem-banner-status",
  schedule: "0 * * * *", // Every hour
}
