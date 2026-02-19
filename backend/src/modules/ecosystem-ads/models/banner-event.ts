import { model } from "@medusajs/framework/utils"

const BannerEvent = model.define("banner_event", {
  id: model.id().primaryKey(),
  banner_id: model.text(),
  site_id: model.text(),
  slot_id: model.text(),
  event_type: model.enum(["impression", "click"]),
})

export default BannerEvent
