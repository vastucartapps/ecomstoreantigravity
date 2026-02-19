import { model } from "@medusajs/framework/utils"

// Singleton record — stores the entire TimeSlotConfig as JSON
const SlotConfig = model.define("booking_slot_config", {
  id: model.id().primaryKey(),
  config: model.json(),
})

export default SlotConfig
