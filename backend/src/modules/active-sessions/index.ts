import { Module } from "@medusajs/framework/utils"
import ActiveSessionModuleService from "./service"

export const ACTIVE_SESSIONS_MODULE = "activeSessionsModuleService"

export default Module(ACTIVE_SESSIONS_MODULE, {
  service: ActiveSessionModuleService,
})
