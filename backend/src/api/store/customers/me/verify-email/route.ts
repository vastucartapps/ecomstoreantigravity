import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { captureException } from "../../../../../lib/error-reporter"
import { fetchBrandFromStore } from "../../../../../lib/brand-from-store"
import {
  buildTokenRecord,
  generatePlaintextToken,
  verifyTokenAgainst,
} from "../../../../../lib/email-verification-token"

/**
 * POST /store/customers/me/verify-email
 *
 * Request a fresh email-verification link. Generates a one-time token, stores
 * its SHA-256 hash on customer.metadata.email_verification, and emails the
 * plaintext token wrapped in a /verify-email?token=… link to the customer's
 * current address.
 *
 * Already-verified customers get a 200 with { already_verified: true } so the
 * UI can suppress the "resend" CTA without revealing whether or not the
 * resend was actually attempted.
 */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  try {
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

    const meta = (customer.metadata as Record<string, any>) || {}
    if (meta.email_verified_at) {
      res.json({ success: true, already_verified: true })
      return
    }

    const plaintext = generatePlaintextToken()
    const record = buildTokenRecord(plaintext)

    await customerModule.updateCustomers(actorId, {
      metadata: { ...meta, email_verification: record },
    })

    const brand = await fetchBrandFromStore(req.scope)
    const url = `${brand.storeUrl}/verify-email#token=${encodeURIComponent(plaintext)}`

    try {
      const notifService = req.scope.resolve(Modules.NOTIFICATION) as any
      await notifService.createNotifications({
        to: customer.email,
        channel: "email",
        template: "email-verification",
        data: {
          url,
          verification_url: url,
          store_name: brand.storeName,
          store_url: brand.storeUrl,
        },
      })
    } catch (notifyErr) {
      captureException(notifyErr, {
        source: "api/store/customers/me/verify-email:notify",
        customer_id: customer.id,
      })
      // Verification record is already persisted — the user can request a
      // resend, but tell them this attempt failed so they know to retry.
      res.status(502).json({ message: "Could not send verification email — please try again." })
      return
    }

    res.json({ success: true })
  } catch (err: any) {
    captureException(err, { source: "api/store/customers/me/verify-email:POST" })
    res.status(500).json({ message: err.message || "Failed to send verification email" })
  }
}

/**
 * PUT /store/customers/me/verify-email
 *
 * Confirm a verification token. Marks the customer as verified when valid
 * and clears the stored token record so it cannot be replayed.
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
    if (!customer) {
      res.status(404).json({ message: "Customer not found" })
      return
    }

    const meta = (customer.metadata as Record<string, any>) || {}
    const stored = meta.email_verification || null

    const result = verifyTokenAgainst(token, stored)
    if (!result.ok) {
      // Increment attempts even on failure so brute-force is throttled.
      if (stored?.hash) {
        await customerModule.updateCustomers(actorId, {
          metadata: {
            ...meta,
            email_verification: { ...stored, attempts: (stored.attempts || 0) + 1 },
          },
        })
      }
      const status = result.reason === "missing" ? 404 : 400
      res.status(status).json({
        success: false,
        message:
          result.reason === "expired"
            ? "This verification link has expired. Please request a new one."
            : result.reason === "exhausted"
              ? "Too many attempts. Please request a new verification link."
              : "Invalid verification token.",
      })
      return
    }

    const nextMeta = { ...meta, email_verified_at: new Date().toISOString() }
    delete (nextMeta as any).email_verification
    await customerModule.updateCustomers(actorId, { metadata: nextMeta })

    res.json({ success: true })
  } catch (err: any) {
    captureException(err, { source: "api/store/customers/me/verify-email:PUT" })
    res.status(500).json({ message: err.message || "Failed to verify email" })
  }
}
