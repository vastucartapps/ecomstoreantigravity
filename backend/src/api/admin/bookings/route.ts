import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../modules/bookings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const { status } = req.query as { status?: string }

  const query: any = {}
  if (status) query.status = status

  const [bookings] = await bookingsService.listAndCountBookings(query, {
    order: { created_at: "DESC" },
    take: 50,
  })

  res.json({ bookings })
}
