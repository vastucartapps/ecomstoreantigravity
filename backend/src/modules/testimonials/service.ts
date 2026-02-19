import { MedusaService } from "@medusajs/framework/utils"
import Testimonial from "./models/testimonial"

class TestimonialModuleService extends MedusaService({ Testimonial }) {}

export default TestimonialModuleService
