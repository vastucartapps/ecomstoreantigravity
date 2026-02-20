import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IAuthModuleService } from "@medusajs/framework/types"

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

    // Get user's email to authenticate with old password
    const userService = req.scope.resolve(Modules.USER) as any
    const user = await userService.retrieveUser(actorId)
    if (!user?.email) {
      res.status(404).json({ message: "User not found" })
      return
    }

    const authService = req.scope.resolve(Modules.AUTH) as IAuthModuleService

    // Verify old password first
    const verifyResult = await authService.authenticate("emailpass", {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: { email: user.email, password: old_password } as any,
    })

    if (!verifyResult.success) {
      res.status(400).json({ message: "Current password is incorrect" })
      return
    }

    // Update to new password
    const updateResult = await authService.updateProvider("emailpass", {
      entity_id: actorId,
      email: user.email,
      password: new_password,
    })

    if (!updateResult.success) {
      res.status(400).json({ message: "Failed to update password" })
      return
    }

    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to change password" })
  }
}
