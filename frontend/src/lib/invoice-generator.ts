/**
 * GST Invoice PDF generator. Seller details (legal name, address, GSTIN,
 * contact) are passed in via `data.seller` — sourced from admin branding
 * + tax config — so a single edit in admin updates every invoice
 * generated thereafter. If `seller` is omitted, falls back to the
 * hardcoded constants from gst-utils so older callers still work.
 *
 * Uses jsPDF for client-side generation.
 */

import {
  calculateGST,
  amountToWords,
  formatINR,
  generateInvoiceNumber,
  DEFAULT_HSN,
  FALLBACK_SELLER_STATE,
  GSTIN_NOT_CONFIGURED,
} from "./gst-utils"
import { BRAND_DEFAULTS, getSiteHost } from "./brand-defaults"

export interface InvoiceItem {
  name: string
  hsn: string
  quantity: number
  rate: number // per unit in rupees
  gstRate: number // e.g. 18
  buyerState?: string
}

/** Seller-side details rendered on the invoice. Sourced from admin
 *  branding + GST config — pass these from callers, do not hardcode. */
export interface InvoiceSeller {
  /** Display brand name (header). E.g. "VastuCart". */
  storeName: string
  /** Legal entity name (sold-by block). E.g. "VastuCart (OPC) Pvt. Ltd." */
  legalName: string
  /** Public website / contact line shown beneath the brand header. */
  websiteAndEmail: string
  /** Seller GSTIN (15 chars). */
  gstin: string
  /** Seller's registered state — drives intra/inter-state GST split. */
  state: string
  /** Multi-line seller address: line 1 + locality+state+pincode. */
  addressLine1: string
  addressLine2: string
}

export interface InvoiceData {
  orderId: string
  orderDate: string
  customerName: string
  customerEmail: string
  shippingAddress: {
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone?: string
  }
  items: InvoiceItem[]
  shippingCharge: number
  currency: string
  /** Optional: pass admin-sourced seller info. Omit to fall back to
   *  the hardcoded constants in gst-utils (legacy behaviour). */
  seller?: InvoiceSeller
}

export async function generateGSTInvoicePDF(data: InvoiceData): Promise<void> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import("jspdf")

  // Resolve seller info: admin-supplied wins, BRAND_DEFAULTS-aligned
  // fallback comes second. Every literal value below now routes through
  // `seller`, so admin edits propagate to invoices.
  // Bug history: the old fallback used a Mumbai address (the brand
  // operates from Varanasi) and a demo GSTIN ("27AAAAA0000A1Z5") — both
  // ended up on customer invoices in dev/staging. They have been retired:
  // the address now mirrors the operational address (BRAND_DEFAULTS), and
  // the GSTIN falls back to the empty sentinel so the renderer surfaces a
  // clear "GSTIN not configured" error instead of stamping a fake number.
  const seller: InvoiceSeller = data.seller || {
    storeName: BRAND_DEFAULTS.storeName,
    legalName: BRAND_DEFAULTS.legalName,
    websiteAndEmail: `${getSiteHost()}  |  ${BRAND_DEFAULTS.contactEmail}`,
    gstin: GSTIN_NOT_CONFIGURED,
    state: FALLBACK_SELLER_STATE,
    addressLine1: BRAND_DEFAULTS.streetAddress,
    addressLine2: `${BRAND_DEFAULTS.addressLocality}, ${BRAND_DEFAULTS.addressRegion} - ${BRAND_DEFAULTS.postalCode}`,
  }

  // Refuse to generate an invoice without a real GSTIN — better a loud
  // error than a customer receiving a tax-invalid document.
  if (!seller.gstin) {
    throw new Error(
      "GSTIN not configured. Set it in Admin → Payments & Tax → GST Configuration before generating invoices."
    )
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const invoiceNo = generateInvoiceNumber(data.orderId)
  const pageW = 210
  const margin = 15
  const contentW = pageW - margin * 2
  let y = margin

  // ─── Helper functions ────────────────────────────────────────────────────────

  const line = (x1: number, y1: number, x2: number, y2: number, color = "#e8e0d8") => {
    doc.setDrawColor(color)
    doc.line(x1, y1, x2, y2)
  }

  const text = (
    txt: string,
    x: number,
    yPos: number,
    opts: { size?: number; bold?: boolean; color?: string; align?: "left" | "right" | "center" } = {}
  ) => {
    const { size = 9, bold = false, color = "#2d2319", align = "left" } = opts
    doc.setFontSize(size)
    doc.setFont("helvetica", bold ? "bold" : "normal")
    doc.setTextColor(color)
    doc.text(txt, x, yPos, { align })
  }

  const rect = (x: number, yPos: number, w: number, h: number, fillColor: string) => {
    doc.setFillColor(fillColor)
    doc.rect(x, yPos, w, h, "F")
  }

  // ─── Header ─────────────────────────────────────────────────────────────────

  // Brand accent bar
  rect(0, 0, pageW, 3, "#2C7A7B")

  y = 10
  text(seller.storeName, margin, y, { size: 18, bold: true, color: "#2C7A7B" })
  text("TAX INVOICE", pageW - margin, y, { size: 14, bold: true, color: "#2C7A7B", align: "right" })

  y += 5
  text(seller.websiteAndEmail, margin, y, { size: 8, color: "#8a7968" })
  text(`Invoice No: ${invoiceNo}`, pageW - margin, y, { size: 8, color: "#8a7968", align: "right" })

  y += 4
  text(`GSTIN: ${seller.gstin}`, margin, y, { size: 8, color: "#8a7968" })
  text(`Date: ${data.orderDate}`, pageW - margin, y, { size: 8, color: "#8a7968", align: "right" })

  y += 3
  line(margin, y, pageW - margin, y)

  // ─── Seller + Buyer block ────────────────────────────────────────────────────

  y += 5
  const col2 = margin + contentW / 2 + 5

  text("SOLD BY", margin, y, { size: 7, bold: true, color: "#8a7968" })
  text("SHIP TO", col2, y, { size: 7, bold: true, color: "#8a7968" })

  y += 4
  text(seller.legalName, margin, y, { size: 8, bold: true })
  text(data.customerName, col2, y, { size: 8, bold: true })

  y += 4
  text(seller.addressLine1, margin, y, { size: 8 })
  text(data.shippingAddress.address1, col2, y, { size: 8 })

  y += 4
  text(seller.addressLine2, margin, y, { size: 8 })
  const buyerLine2 = [
    data.shippingAddress.address2,
    `${data.shippingAddress.city}, ${data.shippingAddress.state} - ${data.shippingAddress.postalCode}`,
  ].filter(Boolean).join(", ")
  text(buyerLine2, col2, y, { size: 8 })

  if (data.shippingAddress.phone) {
    y += 4
    text(`Phone: ${data.shippingAddress.phone}`, col2, y, { size: 8 })
  }

  y += 4
  text(`Email: ${data.customerEmail}`, col2, y, { size: 7, color: "#8a7968" })

  y += 6
  line(margin, y, pageW - margin, y)

  // ─── Order info row ──────────────────────────────────────────────────────────

  y += 5
  text(`Order ID: ${data.orderId}`, margin, y, { size: 8 })
  text(`Order Date: ${data.orderDate}`, pageW - margin, y, { size: 8, align: "right" })

  y += 6
  line(margin, y, pageW - margin, y)

  // ─── Items table header ──────────────────────────────────────────────────────

  y += 1
  rect(margin, y, contentW, 7, "#f0ebe4")
  y += 5

  const cols = {
    no: margin + 2,
    desc: margin + 8,
    hsn: margin + 70,
    qty: margin + 90,
    rate: margin + 105,
    taxable: margin + 122,
    cgst: margin + 140,
    sgst: margin + 152,
    igst: margin + 165,
    total: pageW - margin - 2,
  }

  text("#", cols.no, y, { size: 7, bold: true })
  text("Description", cols.desc, y, { size: 7, bold: true })
  text("HSN", cols.hsn, y, { size: 7, bold: true })
  text("Qty", cols.qty, y, { size: 7, bold: true })
  text("Rate", cols.rate, y, { size: 7, bold: true })
  text("Taxable", cols.taxable, y, { size: 7, bold: true })
  text("CGST", cols.cgst, y, { size: 7, bold: true })
  text("SGST", cols.sgst, y, { size: 7, bold: true })
  text("IGST", cols.igst, y, { size: 7, bold: true })
  text("Total", cols.total, y, { size: 7, bold: true, align: "right" })

  y += 2
  line(margin, y, pageW - margin, y)

  // ─── Items rows ──────────────────────────────────────────────────────────────

  let grandTaxable = 0
  let grandCGST = 0
  let grandSGST = 0
  let grandIGST = 0
  let grandTotal = 0

  data.items.forEach((item, idx) => {
    y += 5
    const taxable = item.rate * item.quantity
    const gst = calculateGST(taxable, item.gstRate, item.buyerState)
    const total = taxable + gst.totalTax

    grandTaxable += taxable
    grandCGST += gst.cgst
    grandSGST += gst.sgst
    grandIGST += gst.igst
    grandTotal += total

    if (idx % 2 === 1) rect(margin, y - 3.5, contentW, 6, "#faf7f4")

    text(`${idx + 1}`, cols.no, y, { size: 7 })
    // Truncate long names
    const nameMaxW = 58
    const truncName = item.name.length > 30 ? item.name.slice(0, 28) + "…" : item.name
    text(truncName, cols.desc, y, { size: 7 })
    text(item.hsn || DEFAULT_HSN, cols.hsn, y, { size: 7 })
    text(String(item.quantity), cols.qty, y, { size: 7 })
    text(formatINR(item.rate), cols.rate, y, { size: 7 })
    text(formatINR(taxable), cols.taxable, y, { size: 7 })
    text(gst.cgst > 0 ? formatINR(gst.cgst) : "—", cols.cgst, y, { size: 7 })
    text(gst.sgst > 0 ? formatINR(gst.sgst) : "—", cols.sgst, y, { size: 7 })
    text(gst.igst > 0 ? formatINR(gst.igst) : "—", cols.igst, y, { size: 7 })
    text(formatINR(total), cols.total, y, { size: 7, align: "right" })
  })

  // Shipping
  if (data.shippingCharge > 0) {
    y += 5
    text("Shipping Charges", cols.desc, y, { size: 7 })
    text("9965", cols.hsn, y, { size: 7 })
    text("1", cols.qty, y, { size: 7 })
    text(formatINR(data.shippingCharge), cols.rate, y, { size: 7 })
    text(formatINR(data.shippingCharge), cols.taxable, y, { size: 7 })
    text(formatINR(data.shippingCharge), cols.total, y, { size: 7, align: "right" })
    grandTotal += data.shippingCharge
  }

  y += 3
  line(margin, y, pageW - margin, y)

  // ─── Totals ──────────────────────────────────────────────────────────────────

  y += 5
  const totalsX = margin + contentW * 0.55
  const totalsW = contentW * 0.45

  const totalRow = (label: string, value: string, bold = false) => {
    text(label, totalsX, y, { size: 8, bold })
    text(value, pageW - margin, y, { size: 8, bold, align: "right" })
    y += 5
  }

  totalRow("Taxable Amount:", formatINR(grandTaxable))
  if (grandCGST > 0) totalRow(`CGST (9%):`, formatINR(grandCGST))
  if (grandSGST > 0) totalRow(`SGST (9%):`, formatINR(grandSGST))
  if (grandIGST > 0) totalRow(`IGST (18%):`, formatINR(grandIGST))
  if (data.shippingCharge > 0) totalRow("Shipping:", formatINR(data.shippingCharge))

  rect(totalsX - 2, y - 2, pageW - margin - totalsX + 4, 8, "#f0ebe4")
  text("Grand Total:", totalsX, y + 4, { size: 9, bold: true, color: "#2C7A7B" })
  text(formatINR(grandTotal), pageW - margin, y + 4, { size: 9, bold: true, color: "#2C7A7B", align: "right" })
  y += 10

  // Amount in words
  y += 2
  line(margin, y, pageW - margin, y)
  y += 5
  text("Amount in Words:", margin, y, { size: 7, bold: true, color: "#8a7968" })
  y += 4
  // Split long text
  const words = amountToWords(grandTotal)
  const wordLines = doc.splitTextToSize(words, contentW)
  wordLines.forEach((wl: string) => {
    text(wl, margin, y, { size: 8, bold: true })
    y += 4
  })

  // ─── Terms ───────────────────────────────────────────────────────────────────

  y += 4
  line(margin, y, pageW - margin, y)
  y += 5
  text("Terms & Conditions", margin, y, { size: 7, bold: true, color: "#8a7968" })
  y += 4
  const terms = [
    "1. Goods once sold will not be taken back or exchanged except as per return policy.",
    "2. This is a computer-generated invoice and does not require a physical signature.",
    "3. Subject to Mumbai jurisdiction.",
  ]
  terms.forEach((t) => {
    text(t, margin, y, { size: 7, color: "#8a7968" })
    y += 4
  })

  // ─── Footer bar ──────────────────────────────────────────────────────────────

  const footerY = 287
  rect(0, footerY, pageW, 10, "#2C7A7B")
  text(`Thank you for shopping with ${seller.storeName}!`, pageW / 2, footerY + 6, {
    size: 8,
    bold: true,
    color: "#ffffff",
    align: "center",
  })

  // ─── Save ────────────────────────────────────────────────────────────────────

  doc.save(`${seller.storeName}-Invoice-${invoiceNo.replace(/\//g, "-")}.pdf`)
}
