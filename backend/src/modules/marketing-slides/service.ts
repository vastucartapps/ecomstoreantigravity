import { MedusaService } from "@medusajs/framework/utils"
import MarketingSlide from "./models/marketing-slide"

class MarketingSlideModuleService extends MedusaService({
  MarketingSlide,
}) {}

export default MarketingSlideModuleService
