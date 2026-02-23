import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import RazorpayDbService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [RazorpayDbService],
})
