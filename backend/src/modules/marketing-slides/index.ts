import { Module } from "@medusajs/framework/utils"
import MarketingSlideModuleService from "./service"

export const MARKETING_SLIDES_MODULE = "marketingSlidesModuleService"

export default Module(MARKETING_SLIDES_MODULE, {
  service: MarketingSlideModuleService,
})
