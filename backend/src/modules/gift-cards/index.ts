import { Module, MedusaService } from "@medusajs/framework/utils"
import GiftCard from "./models/gift-card"

class GiftCardsModuleService extends MedusaService({ GiftCard }) {}

export const GIFT_CARDS_MODULE = "giftCardsModuleService"

export default Module(GIFT_CARDS_MODULE, { service: GiftCardsModuleService })
