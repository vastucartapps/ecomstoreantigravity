import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

/**
 * GET /admin/bookings/service-types — List all service types
 * POST /admin/bookings/service-types — Create a service type
 */

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const types = await bookingsService.listServiceTypes()
  res.json({ service_types: types })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const body = req.body as {
    title: string
    description?: string
    duration_minutes?: number
    price?: number
    currency?: string
    is_active?: boolean
    display_order?: number
  }

  if (!body.title?.trim()) {
    res.status(400).json({ message: "title is required" })
    return
  }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const serviceType = await bookingsService.createServiceType(body)
  res.status(201).json({ service_type: serviceType })
}
