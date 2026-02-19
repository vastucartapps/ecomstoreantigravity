import type { MedusaContainer } from "@medusajs/framework/types"
import { ECOSYSTEM_ADS_MODULE } from "../modules/ecosystem-ads"
import type { IEcosystemAdsService } from "../lib/service-types"

export default async function ecosystemBannerStatusJob(
  container: MedusaContainer
) {
  const logger = container.resolve("logger") as { info: (msg: string) => void }
  const adsService = container.resolve(ECOSYSTEM_ADS_MODULE) as IEcosystemAdsService
  const updated = await adsService.updateBannerStatuses()
  if (updated > 0) {
    logger.info(`[ecosystem-banner-status] Updated ${updated} banner statuses`)
  }
}

export const config = {
  name: "ecosystem-banner-status",
  schedule: "0 * * * *", // Every hour
}
