import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { NOTIFICATIONS_MODULE } from "../../../../../../modules/notifications"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const { notification_id } = req.body as { notification_id?: string }
  const notificationsService = req.scope.resolve(NOTIFICATIONS_MODULE) as any

  if (notification_id) {
    await notificationsService.markAsRead(notification_id, customerId)
  } else {
    await notificationsService.markAllAsRead(customerId)
  }

  res.json({ success: true })
}
