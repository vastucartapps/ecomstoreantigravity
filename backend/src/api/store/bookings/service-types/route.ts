import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

/**
 * GET /store/bookings/service-types — Public list of active service types for storefront
 */

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const types = await bookingsService.listActiveServiceTypes()
  res.json({ service_types: types })
}
