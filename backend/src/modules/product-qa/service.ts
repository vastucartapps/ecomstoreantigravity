import { MedusaService } from "@medusajs/framework/utils"
import ProductQuestion from "./models/product-question"

class ProductQAModuleService extends MedusaService({ ProductQuestion }) {}

export default ProductQAModuleService
