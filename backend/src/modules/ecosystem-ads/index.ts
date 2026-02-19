import { Module } from "@medusajs/framework/utils"
import EcosystemAdsService from "./service"

export const ECOSYSTEM_ADS_MODULE = "ecosystemAdsModuleService"

export default Module(ECOSYSTEM_ADS_MODULE, {
  service: EcosystemAdsService,
})
