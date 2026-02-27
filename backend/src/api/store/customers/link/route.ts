import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * GET /store/customers/link?email=...
 *
 * Pre-flight check: called BEFORE POST /store/customers to detect whether the
 * email belongs to a Medusa admin user.  If it does, the frontend redirects the
 * user to /admin-login instead of creating a customer account.
 *
 * Requires a registration JWT so that only the authenticated Google user can
 * query their own email.
 *
 * Response: { is_admin: boolean }
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const email = (req.query as Record<string, string>)?.email
  if (!email) return res.status(400).json({ message: "email is required" })

  try {
    const userService = req.scope.resolve(Modules.USER)
    const users = await userService.listUsers({ email }, { take: 1 })
    return res.json({ is_admin: users.length > 0 })
  } catch {
    // If the user module is unavailable, assume not admin to avoid blocking sign-in
    return res.json({ is_admin: false })
  }
}

/**
 * POST /store/customers/link
 *
 * Links a Google (or other OAuth) auth identity to an existing customer account
 * that was created via email+password.  Called from the frontend callback page
 * when POST /store/customers returns 422 (email already registered).
 *
 * Requires a registration JWT (actor_id must be empty — not yet linked to any
 * customer). The middleware for this route uses allowUnregistered: true so that
 * registration JWTs are accepted.
 *
 * Body: { email: string }
 * Response: { success: true }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  // Guard: only allow unlinked registration JWTs
  if (req.auth_context?.actor_id) {
    return res.status(400).json({ message: "Already authenticated as a customer." })
  }

  const authIdentityId = req.auth_context?.auth_identity_id
  if (!authIdentityId) {
    return res.status(401).json({ message: "No auth identity in request." })
  }

  const { email } = req.body as { email?: string }
  if (!email) {
    return res.status(400).json({ message: "email is required." })
  }

  const customerModule = req.scope.resolve(Modules.CUSTOMER)
  const [customers] = await customerModule.listAndCountCustomers(
    { email, has_account: true },
    { skip: 0, take: 1 }
  )

  if (!customers.length) {
    return res.status(404).json({ message: "No registered customer found with this email." })
  }

  const customer = customers[0]

  const authService = req.scope.resolve(Modules.AUTH)
  const authIdentity = await authService.retrieveAuthIdentity(authIdentityId)
  const appMetadata = (authIdentity.app_metadata as Record<string, any>) || {}

  // If already linked to a different customer, reject to avoid hijacking
  if (appMetadata.customer_id && appMetadata.customer_id !== customer.id) {
    return res.status(409).json({
      message: "Auth identity already linked to a different account.",
    })
  }

  appMetadata.customer_id = customer.id
  await authService.updateAuthIdentities({
    id: authIdentityId,
    app_metadata: appMetadata,
  })

  return res.json({ success: true })
}
