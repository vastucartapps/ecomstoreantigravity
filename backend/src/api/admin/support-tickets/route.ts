import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPORT_TICKETS_MODULE } from "../../../modules/support-tickets"

/** GET /admin/support-tickets?status=open|closed&limit=50&offset=0 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(SUPPORT_TICKETS_MODULE) as any
    const { status, limit = "50", offset = "0" } = req.query as Record<string, string>

    const filter: any = {}
    if (status && status !== "all") filter.status = status

    const [tickets, count] = await service.listAndCountSupportTickets(filter, {
      order: { created_at: "DESC" },
      take: Math.min(parseInt(limit) || 50, 200),
      skip: parseInt(offset) || 0,
    })

    res.json({ tickets, count })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to fetch tickets" })
  }
}
