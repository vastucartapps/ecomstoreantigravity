import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ACTIVE_SESSIONS_MODULE } from "../../../../../modules/active-sessions"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const activeSessionsService = req.scope.resolve(ACTIVE_SESSIONS_MODULE)
  const authIdentityId = req.auth_context?.auth_identity_id

  if (!authIdentityId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const [sessions] = await activeSessionsService.listAndCountActiveSessions(
    { auth_identity_id: authIdentityId },
    { order: { last_active: "DESC" } }
  )

  res.json({ sessions })
}

export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  // Revoke all sessions except current
  const activeSessionsService = req.scope.resolve(ACTIVE_SESSIONS_MODULE)
  const authIdentityId = req.auth_context?.auth_identity_id

  if (!authIdentityId) {
    res.status(401).json({ message: "Not authenticated" })
    return
  }

  const [sessions] = await activeSessionsService.listAndCountActiveSessions({
    auth_identity_id: authIdentityId,
    is_current: false,
  })

  if (sessions.length > 0) {
    await activeSessionsService.deleteActiveSessions(
      sessions.map((s: any) => s.id)
    )
  }

  res.json({ revoked: sessions.length })
}
