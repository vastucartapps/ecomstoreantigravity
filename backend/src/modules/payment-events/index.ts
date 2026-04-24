import { Module } from "@medusajs/framework/utils"
import PaymentEventsModuleService from "./service"

export const PAYMENT_EVENTS_MODULE = "paymentEventsModuleService"

export default Module(PAYMENT_EVENTS_MODULE, {
  service: PaymentEventsModuleService,
})
