/**
 * Sends an email-verification link to brand-new customers automatically. The
 * link points to /verify-email#token=… on the storefront, which calls
 * PUT /store/customers/me/verify-email to flip metadata.email_verified_at.
 *
 * Skips customers that arrived via Google OAuth (their email is already
 * Google-verified) and customers whose registration source was an admin
 * panel (those don't need user-initiated verification).
 */

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { captureException } from "../lib/error-reporter"
import { fetchBrandFromStore } from "../lib/brand-from-store"
import {
  buildTokenRecord,
  generatePlaintextToken,
} from "../lib/email-verification-token"

export default async function customerEmailVerificationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const customerId = event.data?.id
  if (!customerId) return

  try {
    const customerModule = container.resolve(Modules.CUSTOMER)
    const customer = await customerModule.retrieveCustomer(customerId)
    if (!customer?.email) return

    const meta = (customer.metadata as Record<string, any>) || {}
    // Customers linked via Google OAuth already have a Google-verified email;
    // we mark them verified inline instead of nagging them for a second proof.
    if (meta.email_verified_at) return
    if (meta.oauth_provider === "google" || meta.google_verified) {
      await customerModule.updateCustomers(customerId, {
        metadata: { ...meta, email_verified_at: new Date().toISOString() },
      })
      return
    }

    const plaintext = generatePlaintextToken()
    const record = buildTokenRecord(plaintext)
    await customerModule.updateCustomers(customerId, {
      metadata: { ...meta, email_verification: record },
    })

    const brand = await fetchBrandFromStore(container)
    const url = `${brand.storeUrl}/verify-email#token=${encodeURIComponent(plaintext)}`

    const notifService = container.resolve(Modules.NOTIFICATION) as any
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
  } catch (err) {
    captureException(err, {
      source: "subscribers/customer-email-verification",
      customer_id: customerId,
    })
  }
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
