import { Module } from "@medusajs/framework/utils"
import NotificationsModuleService from "./service"

export const NOTIFICATIONS_MODULE = "notificationsModuleService"

export default Module(NOTIFICATIONS_MODULE, {
  service: NotificationsModuleService,
})
