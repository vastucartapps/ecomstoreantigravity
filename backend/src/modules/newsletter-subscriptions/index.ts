import { Module } from "@medusajs/framework/utils"
import NewsletterSubscriptionModuleService from "./service"

export const NEWSLETTER_SUBSCRIPTIONS_MODULE = "newsletterSubscriptionModuleService"

export default Module(NEWSLETTER_SUBSCRIPTIONS_MODULE, { service: NewsletterSubscriptionModuleService })
