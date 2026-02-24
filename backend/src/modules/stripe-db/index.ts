import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import StripeDbService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [StripeDbService],
})
