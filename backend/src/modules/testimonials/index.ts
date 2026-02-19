import { Module } from "@medusajs/framework/utils"
import TestimonialModuleService from "./service"

export const TESTIMONIALS_MODULE = "testimonialModuleService"

export default Module(TESTIMONIALS_MODULE, { service: TestimonialModuleService })
