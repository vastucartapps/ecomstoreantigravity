import { Module, MedusaService } from "@medusajs/framework/utils"
import SupportTicket from "./models/support-ticket"

class SupportTicketsModuleService extends MedusaService({ SupportTicket }) {}

export const SUPPORT_TICKETS_MODULE = "supportTicketsModuleService"

export default Module(SUPPORT_TICKETS_MODULE, { service: SupportTicketsModuleService })
