import { Module } from "@medusajs/framework/utils"
import ProductQAModuleService from "./service"

export const PRODUCT_QA_MODULE = "productQAModuleService"

export default Module(PRODUCT_QA_MODULE, {
  service: ProductQAModuleService,
})
