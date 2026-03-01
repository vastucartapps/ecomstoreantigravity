import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { BOOKINGS_MODULE } from "../../../../../modules/bookings"

/**
 * GET /store/bookings/service-types/:slug
 * Public — returns a single active service type by slug for detail pages.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const { slug } = req.params as { slug: string }

  if (!slug?.trim()) {
    res.status(400).json({ message: "slug is required" })
    return
  }

  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const serviceType = await bookingsService.getServiceTypeBySlug(slug)

  if (!serviceType) {
    res.status(404).json({ message: "Consultation not found" })
    return
  }

  res.json({ service_type: serviceType })
}
