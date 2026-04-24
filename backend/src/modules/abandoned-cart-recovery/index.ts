import { Module } from "@medusajs/framework/utils"
import AbandonedCartRecoveryModuleService from "./service"

export const ABANDONED_CART_RECOVERY_MODULE = "abandonedCartRecoveryModuleService"

export default Module(ABANDONED_CART_RECOVERY_MODULE, {
  service: AbandonedCartRecoveryModuleService,
})
