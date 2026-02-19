import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { NOTIFICATIONS_MODULE } from "../../../../../modules/notifications"
import type { INotificationsService } from "../../../../../lib/service-types"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const { type, limit, offset } = req.query as {
    type?: string
    limit?: string
    offset?: string
  }

  const notificationsService = req.scope.resolve(NOTIFICATIONS_MODULE) as INotificationsService
  const result = await notificationsService.listByCustomer(customerId, {
    type: type as any,
    limit: limit ? parseInt(limit) : 20,
    offset: offset ? parseInt(offset) : 0,
  })

  res.json(result)
}
