import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKINGS_MODULE } from "../../../../modules/bookings"
import { captureException } from "../../../../lib/error-reporter"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
    const record = await bookingsService.getSlotConfig()
    res.json({ config: record?.config ?? null })
  } catch (err) {
    captureException(err, { source: "api/admin/bookings/slot-config:GET" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to load slot config",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const configData = req.body as Record<string, unknown>
    const bookingsService = req.scope.resolve(BOOKINGS_MODULE) as any
    const record = await bookingsService.saveSlotConfig(configData)
    res.json({ config: record?.config ?? null })
  } catch (err) {
    captureException(err, { source: "api/admin/bookings/slot-config:POST" })
    res.status(500).json({
      message: (err as Error)?.message || "Failed to save slot config",
    })
  }
}
