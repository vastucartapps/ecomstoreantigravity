import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"

/**
 * PATCH /admin/bookings/service-types/:id — Update a service type
 * DELETE /admin/bookings/service-types/:id — Delete a service type
 */

export const PATCH = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const { id } = req.params
  const body = req.body as Partial<{
    title: string
    description: string
    duration_minutes: number
    price: number
    currency: string
    is_active: boolean
    display_order: number
  }>

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const updated = await bookingsService.updateServiceType(id, body)
  res.json({ service_type: updated })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const { id } = req.params
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  await bookingsService.deleteServiceType(id)
  res.json({ id, deleted: true })
}
