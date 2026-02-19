import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const blockedDateId = req.params.id
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  await bookingsService.removeBlockedDate(blockedDateId)
  res.json({ id: blockedDateId, deleted: true })
}
