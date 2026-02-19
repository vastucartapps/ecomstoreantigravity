import { Module } from "@medusajs/framework/utils"
import PushSubscriptionService from "./service"

export const PUSH_SUBSCRIPTIONS_MODULE = "pushSubscriptionsModuleService"

export default Module(PUSH_SUBSCRIPTIONS_MODULE, {
  service: PushSubscriptionService,
})
