import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

/**
 * GET /admin/bookings/stats — Booking analytics matrix
 */

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const stats = await bookingsService.getBookingStats()
  res.json({ stats })
}
