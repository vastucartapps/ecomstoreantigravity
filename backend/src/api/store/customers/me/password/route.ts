import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IAuthModuleService } from "@medusajs/framework/types"
import { captureException } from "../../../../../lib/error-reporter"

/**
 * POST /store/customers/me/password
 *
 * Change a logged-in customer's password. Mirrors the admin counterpart at
 * /admin/users/me/password — verifies the current password by re-authenticating
 * against the emailpass provider before issuing the update, so an attacker who
 * temporarily has access to a logged-in browser cannot silently change the
 * password and lock out the real user.
 *
 * Body: { old_password: string, new_password: string }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const { old_password, new_password } = req.body as {
      old_password?: string
      new_password?: string
    }

    if (!old_password || !new_password) {
      res.status(400).json({ message: "old_password and new_password are required" })
      return
    }
    if (new_password.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters" })
      return
    }

    const actorId = req.auth_context?.actor_id
    if (!actorId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerModule.retrieveCustomer(actorId)
    if (!customer?.email) {
      res.status(404).json({ message: "Customer not found" })
      return
    }

    const authService = req.scope.resolve(Modules.AUTH) as IAuthModuleService

    const verifyResult = await authService.authenticate("emailpass", {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: { email: customer.email, password: old_password } as any,
    })
    if (!verifyResult.success) {
      res.status(400).json({ message: "Current password is incorrect" })
      return
    }

    const updateResult = await authService.updateProvider("emailpass", {
      entity_id: customer.email,
      password: new_password,
    })
    if (!updateResult.success) {
      res.status(400).json({ message: "Failed to update password" })
      return
    }

    // Wipe recorded sessions — the user's other devices/browsers should be
    // forced to re-authenticate, matching the password-reset behavior.
    try {
      const authIdentityId = req.auth_context?.auth_identity_id
      if (authIdentityId) {
        const activeSessionsService = req.scope.resolve(
          // Avoid an import-time dependency cycle between auth middleware and
          // this route — resolve by string identifier instead.
          "activeSessionsService" as any
        ) as any
        if (activeSessionsService) {
          const [sessions] = await activeSessionsService.listAndCountActiveSessions({
            auth_identity_id: authIdentityId,
          })
          for (const s of sessions) {
            await activeSessionsService.deleteActiveSessions(s.id).catch(() => undefined)
          }
        }
      }
    } catch {
      // active-sessions module not available — non-fatal
    }

    res.json({ success: true })
  } catch (err: any) {
    captureException(err, { source: "api/store/customers/me/password:POST" })
    res.status(500).json({ message: err.message || "Failed to change password" })
  }
}
