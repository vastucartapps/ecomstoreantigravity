/**
 * GST calculation utilities for VastuCart India.
 *
 * Seller GSTIN + state used to live as hardcoded demo values here. They
 * have been removed — invoices now fail loudly if the admin hasn't saved
 * a real GSTIN. Better a clear "GSTIN not configured" error than a
 * customer receiving an invoice stamped 27AAAAA0000A1Z5.
 *
 * Use `fetchInvoiceSeller()` (seller-from-admin.ts) to resolve the
 * canonical seller record from admin Payments & Tax config. The
 * BRAND_DEFAULTS.sellerState seed kicks in only when the admin hasn't
 * saved a state — and matches the operational address (Uttar Pradesh).
 */

import { BRAND_DEFAULTS } from "./brand-defaults"

export const DEFAULT_HSN = "71179090" // Imitation jewellery / decorative items
export const DEFAULT_GST_RATE = 18 // 18% GST (9% CGST + 9% SGST intra-state, 18% IGST inter-state)

/** Seller's registered state. Sourced from BRAND_DEFAULTS so it matches
 *  the operational address. Admin can override via Payments & Tax → GST
 *  Configuration → Seller State (the override surfaces through
 *  seller-from-admin.ts). */
export const FALLBACK_SELLER_STATE = BRAND_DEFAULTS.sellerState

/**
 * Sentinel value used when an admin GSTIN lookup fails. Callers should
 * treat this as "GSTIN not configured" and surface an actionable error
 * to the admin instead of stamping a fake number on the invoice.
 */
export const GSTIN_NOT_CONFIGURED = ""

export interface GSTBreakdown {
  taxableAmount: number
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  isInterState: boolean
}

/**
 * Calculate GST breakdown.
 * @param amount - Amount in rupees (NOT paise)
 * @param rate - GST rate in % (default 18)
 * @param buyerState - Buyer's state for inter/intra determination
 * @param sellerState - Seller's registered state (admin-driven; falls back to BRAND_DEFAULTS.sellerState)
 */
export function calculateGST(
  amount: number,
  rate: number = DEFAULT_GST_RATE,
  buyerState?: string,
  sellerState: string = FALLBACK_SELLER_STATE
): GSTBreakdown {
  const isInterState = !buyerState || buyerState.toLowerCase() !== sellerState.toLowerCase()
  const totalTax = (amount * rate) / 100

  if (isInterState) {
    return { taxableAmount: amount, cgst: 0, sgst: 0, igst: totalTax, totalTax, isInterState }
  } else {
    const half = totalTax / 2
    return { taxableAmount: amount, cgst: half, sgst: half, igst: 0, totalTax, isInterState }
  }
}

/**
 * Convert amount in rupees to Indian English words
 */
export function amountToWords(amount: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  function below1000(n: number): string {
    if (n === 0) return ""
    if (n < 20) return ones[n] + " "
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "") + " "
    return ones[Math.floor(n / 100)] + " Hundred " + below1000(n % 100)
  }

  function toWords(n: number): string {
    if (n === 0) return "Zero"
    let result = ""
    if (n >= 10000000) { result += below1000(Math.floor(n / 10000000)) + "Crore "; n %= 10000000 }
    if (n >= 100000)   { result += below1000(Math.floor(n / 100000)) + "Lakh "; n %= 100000 }
    if (n >= 1000)     { result += below1000(Math.floor(n / 1000)) + "Thousand "; n %= 1000 }
    result += below1000(n)
    return result.trim()
  }

  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let result = "Rupees " + toWords(rupees)
  if (paise > 0) result += " and " + toWords(paise) + " Paise"
  return result + " Only"
}

/**
 * Format amount as Indian currency string
 */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Generate invoice number from order ID + date
 */
export function generateInvoiceNumber(orderId: string): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const shortId = orderId.replace("order_", "").slice(-6).toUpperCase()
  return `VC/${year}-${Number(year) + 1}/${month}/${shortId}`
}
