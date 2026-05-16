/**
 * Build the seller block of an invoice from admin-canonical sources.
 *
 * Why this exists: invoices used to embed hardcoded "VastuCart (OPC) Pvt.
 * Ltd.", a hardcoded address, and a hardcoded GSTIN. None of those
 * propagated when admin updated branding or tax config. This helper
 * collapses both admin sources (storefront-config branding + payment-tax
 * config GSTIN) into the InvoiceSeller shape that invoice-generator.ts
 * accepts. Callers fetch once per invoice and pass.
 *
 * Falls back gracefully if either endpoint is unreachable so an offline
 * admin still gets a valid invoice — using the BRAND_DEFAULTS seed values
 * (Varanasi address, no fake GSTIN).
 */

import { BRAND_DEFAULTS, getSiteHost } from "@/lib/brand-defaults"
import { FALLBACK_SELLER_STATE, GSTIN_NOT_CONFIGURED } from "@/lib/gst-utils"
import type { InvoiceSeller } from "@/lib/invoice-generator"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function fetchInvoiceSeller(): Promise<InvoiceSeller> {
  const headers = { "x-publishable-api-key": PUB_KEY }
  const host = getSiteHost()

  // Defaults — used when the backend is unreachable or admin hasn't
  // filled values. legalName uses BRAND_DEFAULTS (not "X (OPC) Pvt. Ltd.")
  // because the user's legal entity is a sole proprietorship; the prior
  // suffix added an incorrect company suffix to every invoice.
  const fallback: InvoiceSeller = {
    storeName: BRAND_DEFAULTS.storeName,
    legalName: BRAND_DEFAULTS.legalName,
    websiteAndEmail: `${host}  |  ${BRAND_DEFAULTS.contactEmail}`,
    gstin: GSTIN_NOT_CONFIGURED,
    state: FALLBACK_SELLER_STATE,
    addressLine1: BRAND_DEFAULTS.streetAddress,
    addressLine2: `${BRAND_DEFAULTS.addressLocality}, ${BRAND_DEFAULTS.addressRegion} - ${BRAND_DEFAULTS.postalCode}`,
  }

  try {
    const [storefrontRes, paymentRes] = await Promise.all([
      fetch(`${BACKEND_URL}/store/storefront-config`, { headers }),
      fetch(`${BACKEND_URL}/store/payment-config`, { headers }),
    ])

    const out: InvoiceSeller = { ...fallback }

    if (storefrontRes.ok) {
      const data = await storefrontRes.json()
      const b = data.config?.branding
      if (b) {
        if (b.storeName) out.storeName = b.storeName
        if (b.legalName) {
          out.legalName = b.legalName
        } else if (b.storeName) {
          // Don't auto-suffix "(OPC) Pvt. Ltd." — that's a corporate form
          // assumption that doesn't apply to a sole-proprietor seller.
          out.legalName = b.storeName
        }
        if (b.contactEmail) {
          out.websiteAndEmail = `${host}  |  ${b.contactEmail}`
        }
        if (b.streetAddress) out.addressLine1 = b.streetAddress
        if (b.addressLocality && b.addressRegion && b.postalCode) {
          out.addressLine2 = `${b.addressLocality}, ${b.addressRegion} - ${b.postalCode}`
        }
      }
    }

    if (paymentRes.ok) {
      const data = await paymentRes.json()
      if (data.gstin) out.gstin = data.gstin
      if (data.seller_state) out.state = data.seller_state
    }

    return out
  } catch {
    return fallback
  }
}
