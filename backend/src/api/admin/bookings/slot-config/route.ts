import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const record = await bookingsService.getSlotConfig()
  res.json({ config: record.config })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const configData = req.body as Record<string, unknown>
  const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
  const record = await bookingsService.saveSlotConfig(configData)
  res.json({ config: record.config })
}
