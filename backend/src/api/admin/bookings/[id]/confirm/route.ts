import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingId = req.params.id
  const { meeting_link } = req.body as { meeting_link?: string }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const booking = await bookingsService.updateBookingStatus(bookingId, "confirmed", meeting_link)

  res.json({ booking })
}
