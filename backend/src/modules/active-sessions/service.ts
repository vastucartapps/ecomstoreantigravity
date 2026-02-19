import { MedusaService } from "@medusajs/framework/utils"
import ActiveSession from "./models/active-session"

class ActiveSessionModuleService extends MedusaService({
  ActiveSession,
}) {}

export default ActiveSessionModuleService
