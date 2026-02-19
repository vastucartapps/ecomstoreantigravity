import { MedusaService } from "@medusajs/framework/utils"
import NewsletterSubscription from "./models/newsletter-subscription"

class NewsletterSubscriptionModuleService extends MedusaService({ NewsletterSubscription }) {}

export default NewsletterSubscriptionModuleService
