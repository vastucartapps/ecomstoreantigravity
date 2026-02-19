import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingId = req.params.id
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const [bookings] = await bookingsService.listAndCountBookings(
    { id: bookingId },
    { take: 1 }
  )
  if (!bookings.length) {
    res.status(404).json({ message: "Booking not found" })
    return
  }
  res.json({ booking: bookings[0] })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingId = req.params.id
  const body = req.body as { status?: string; meeting_link?: string; notes?: string }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const booking = await bookingsService.updateBookingFields(bookingId, {
    status: body.status,
    meeting_link: body.meeting_link,
    notes: body.notes,
  })

  res.json({ booking })
}
