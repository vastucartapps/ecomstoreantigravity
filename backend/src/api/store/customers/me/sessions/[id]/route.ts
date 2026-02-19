import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ACTIVE_SESSIONS_MODULE } from "../../../../../../modules/active-sessions"

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const activeSessionsService = req.scope.resolve(ACTIVE_SESSIONS_MODULE)
  const authIdentityId = req.auth_context?.auth_identity_id
  const { id } = req.params

  if (!authIdentityId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  // Verify the session belongs to this user
  const session = await activeSessionsService.retrieveActiveSession(id)

  if (session.auth_identity_id !== authIdentityId) {
    res.status(403).json({ message: "Forbidden" })
    return
  }

  if (session.is_current) {
    res.status(400).json({ message: "Cannot revoke current session" })
    return
  }

  await activeSessionsService.deleteActiveSessions(id)

  res.json({ id, revoked: true })
}
