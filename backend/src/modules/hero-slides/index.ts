import { Module } from "@medusajs/framework/utils"
import HeroSlideModuleService from "./service"

export const HERO_SLIDES_MODULE = "heroSlidesModuleService"

export default Module(HERO_SLIDES_MODULE, { service: HeroSlideModuleService })
