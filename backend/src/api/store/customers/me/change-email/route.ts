import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IAuthModuleService } from "@medusajs/framework/types"
import { captureException, captureWarning } from "../../../../../lib/error-reporter"
import { fetchBrandFromStore } from "../../../../../lib/brand-from-store"
import {
  buildTokenRecord,
  generatePlaintextToken,
  verifyTokenAgainst,
} from "../../../../../lib/email-verification-token"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /store/customers/me/change-email
 *
 * Step 1 of the change-email flow. Validates that the new address is well
 * formed and not already used by another customer, then emails a one-time
 * verification link to the new address. The change is only applied once the
 * customer clicks that link (PUT below). Confirmation goes to the new
 * address — never the old — so an attacker who hijacks the session cannot
 * silently swap the account to an address they control.
 *
 * Body: { new_email: string }
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const actorId = req.auth_context?.actor_id
    if (!actorId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }

    const { new_email } = (req.body as { new_email?: string }) || {}
    const target = new_email?.toLowerCase().trim()
    if (!target || !EMAIL_RE.test(target) || target.length > 254) {
      res.status(400).json({ message: "A valid new email is required" })
      return
    }

    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerModule.retrieveCustomer(actorId)
    if (!customer?.email) {
      res.status(404).json({ message: "Customer not found" })
      return
    }
    if (customer.email.toLowerCase() === target) {
      res.status(400).json({ message: "This is already your email address" })
      return
    }

    const [existing] = await customerModule.listAndCountCustomers(
      { email: target, has_account: true },
      { skip: 0, take: 1 }
    )
    if (existing.length) {
      res.status(409).json({ message: "Another account already uses this email" })
      return
    }

    const plaintext = generatePlaintextToken()
    const record = buildTokenRecord(plaintext, { newEmail: target })
    const meta = (customer.metadata as Record<string, any>) || {}
    await customerModule.updateCustomers(actorId, {
      metadata: { ...meta, email_change: record },
    })

    const brand = await fetchBrandFromStore(req.scope)
    const url = `${brand.storeUrl}/account/change-email/verify#token=${encodeURIComponent(plaintext)}`

    try {
      const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
      await notifService.createNotifications({
        to: target,
        channel: "email",
        template: "email-verification",
        data: {
          url,
          verification_url: url,
          store_name: brand.storeName,
          store_url: brand.storeUrl,
          subject: `Confirm your new ${brand.storeName} email`,
          title: "Confirm your new email",
        },
      })
    } catch (notifyErr) {
      captureException(notifyErr, {
        source: "api/store/customers/me/change-email:notify",
        customer_id: customer.id,
      })
      res.status(502).json({ message: "Could not send confirmation email — please try again." })
      return
    }

    res.json({ success: true, sent_to: target })
  } catch (err: any) {
    captureException(err, { source: "api/store/customers/me/change-email:POST" })
    res.status(500).json({ message: err.message || "Failed to request email change" })
  }
}

/**
 * PUT /store/customers/me/change-email
 *
 * Step 2: confirm with the token sent to the new address. Updates the
 * customer record AND the emailpass provider's entity_id so that the user
 * can still log in with email+password after the change.
 */
export async function PUT(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
    const actorId = req.auth_context?.actor_id
    if (!actorId) {
      res.status(401).json({ message: "Unauthorized" })
      return
    }
    const { token } = (req.body as { token?: string }) || {}
    if (!token) {
      res.status(400).json({ message: "token is required" })
      return
    }

    const customerModule = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerModule.retrieveCustomer(actorId)
    if (!customer?.email) {
      res.status(404).json({ message: "Customer not found" })
      return
    }
    const meta = (customer.metadata as Record<string, any>) || {}
    const stored = meta.email_change || null

    const result = verifyTokenAgainst(token, stored)
    if (!result.ok) {
      if (stored?.hash) {
        await customerModule.updateCustomers(actorId, {
          metadata: {
            ...meta,
            email_change: { ...stored, attempts: (stored.attempts || 0) + 1 },
          },
        })
      }
      const status = result.reason === "missing" ? 404 : 400
      res.status(status).json({
        success: false,
        message:
          result.reason === "expired"
            ? "This confirmation link has expired. Please start the change again."
            : result.reason === "exhausted"
              ? "Too many attempts. Please start the change again."
              : "Invalid confirmation token.",
      })
      return
    }

    const newEmail = result.record.new_email
    if (!newEmail) {
      res.status(400).json({ message: "Stored token is missing a target address" })
      return
    }

    // Update the auth identity's emailpass entity_id so the user can log in
    // with the new address. Without this, customer.email would change but
    // their email+password login would still be tied to the old address.
    try {
      const authService = req.scope.resolve(Modules.AUTH) as IAuthModuleService
      await authService.updateProvider("emailpass", {
        entity_id: customer.email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new_entity_id: newEmail,
      } as any)
    } catch (authErr) {
      captureWarning("change-email: auth provider update failed — customer record not changed", {
        source: "api/store/customers/me/change-email:PUT",
        customer_id: customer.id,
        error: (authErr as Error)?.message,
      })
      res.status(500).json({
        message:
          "We couldn't update your sign-in credentials — your old email is still active.",
      })
      return
    }

    const nextMeta = { ...meta, email_verified_at: new Date().toISOString() }
    delete (nextMeta as any).email_change
    await customerModule.updateCustomers(actorId, {
      email: newEmail,
      metadata: nextMeta,
    })

    res.json({ success: true, email: newEmail })
  } catch (err: any) {
    captureException(err, { source: "api/store/customers/me/change-email:PUT" })
    res.status(500).json({ message: err.message || "Failed to confirm email change" })
  }
}
