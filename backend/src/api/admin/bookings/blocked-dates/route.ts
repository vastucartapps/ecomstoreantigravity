import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const dates = await bookingsService.listBlockedDatesAll()
  res.json({ blocked_dates: dates })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { date, reason } = req.body as { date: string; reason: string }
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const blocked = await bookingsService.addBlockedDate(date, reason || "")
  res.json({ blocked_date: blocked })
}
