import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const bookings = await bookingsService.listByCustomer(customerId)

  res.json({ bookings })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const body = req.body as {
    title: string
    consultant_name?: string
    date: string
    time: string
    notes?: string
    price?: number
    currency?: string
  }

  if (!body.title || !body.date || !body.time) {
    res.status(400).json({ message: "title, date, and time are required" })
    return
  }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const booking = await bookingsService.createBookingForCustomer(customerId, body)

  res.status(201).json({ booking })
}
