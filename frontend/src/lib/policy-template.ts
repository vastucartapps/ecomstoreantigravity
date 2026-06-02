/**
 * Template-variable interpolation for legal/policy pages.
 *
 * Admin-edited markdown (via contentPages CMS) and fallback markdown in
 * each legal page may contain placeholders like {{contactEmail}} or
 * {{returnWindowDays}}. At render time we substitute the canonical admin
 * values — branding.contactEmail, returnPolicy.windowDays, etc. — so a
 * single edit in admin propagates to every legal page that references
 * that value.
 *
 * Supported variables are listed in `POLICY_VARIABLE_HELP` and surfaced
 * in the admin contentPages editor so authors know what they can use.
 */

export interface PolicyVariables {
  storeName: string
  contactEmail: string
  contactPhone: string
  whatsapp?: string
  streetAddress: string
  addressLocality: string
  addressRegion: string
  postalCode: string
  addressCountry: string
  fullAddress: string
  returnWindowDays: number
  inspectionDays: string
  refundDays: string
  freeShippingThresholdInr: number
  freeShippingThresholdUsd: number
  codMinOrderInr: number
  codMaxOrderInr: number
  codFee: number
  /** Founder display name (about page + grievance officer record). Source:
   *  admin Storefront → About → Founder. Falls back to BRAND_DEFAULTS. */
  founderName: string
  /** Legal entity name as registered for GSTIN. Used in policy
   *  boilerplate ("VastuCart is operated by ..."). Source: admin
   *  Payments & Tax → GST Configuration → Legal Entity Name. */
  legalName: string
  /** GSTIN — appears in legal boilerplate next to legal name. */
  gstin: string
  /** Registered legal address per GSTIN — distinct from operational
   *  address. Source: admin Payments & Tax → GST → Registered Address. */
  registeredAddress: string
  /** Per-purpose support email addresses. Source: admin Payments & Tax →
   *  Support Emails (override) or BRAND_DEFAULTS.supportEmails (seed). */
  wholesaleEmail: string
  returnsEmail: string
  grievanceEmail: string
  privacyEmail: string
  legalEmail: string
  ordersEmail: string
  /** Markdown-formatted bullet list of cluster sister-site domains.
   *  Source: admin Storefront → Cluster Sites override OR the
   *  CLUSTER_SITES seed. Lets privacy-policy / terms reference the full
   *  ecosystem dynamically as the cluster grows. */
  clusterDomainsList: string
}

/** Format a number as INR with the ₹ symbol and Indian thousands grouping. */
function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`
}

/** Format a number as USD with the $ symbol. */
function usd(n: number): string {
  return `$${n.toLocaleString("en-US")}`
}

/**
 * Interpolate {{variable}} placeholders in the given markdown using the
 * supplied policy variables. Unknown placeholders are left untouched
 * (rather than rendered as empty strings) so authors notice typos.
 */
export function interpolatePolicy(
  markdown: string,
  vars: PolicyVariables
): string {
  // Pre-format derived/aggregate values once
  const replacements: Record<string, string> = {
    storeName: vars.storeName,
    contactEmail: vars.contactEmail,
    contactPhone: vars.contactPhone,
    whatsapp: vars.whatsapp || vars.contactPhone,
    streetAddress: vars.streetAddress,
    addressLocality: vars.addressLocality,
    addressRegion: vars.addressRegion,
    postalCode: vars.postalCode,
    addressCountry: vars.addressCountry,
    fullAddress: vars.fullAddress,
    returnWindowDays: String(vars.returnWindowDays),
    inspectionDays: vars.inspectionDays,
    refundDays: vars.refundDays,
    freeShippingThresholdInr: inr(vars.freeShippingThresholdInr),
    freeShippingThresholdUsd: usd(vars.freeShippingThresholdUsd),
    codMinOrderInr: inr(vars.codMinOrderInr),
    codMaxOrderInr: inr(vars.codMaxOrderInr),
    codFee: vars.codFee > 0 ? inr(vars.codFee) : "no extra charge",
    founderName: vars.founderName,
    legalName: vars.legalName,
    gstin: vars.gstin,
    registeredAddress: vars.registeredAddress,
    wholesaleEmail: vars.wholesaleEmail,
    returnsEmail: vars.returnsEmail,
    grievanceEmail: vars.grievanceEmail,
    privacyEmail: vars.privacyEmail,
    legalEmail: vars.legalEmail,
    ordersEmail: vars.ordersEmail,
    clusterDomainsList: vars.clusterDomainsList,
  }

  return markdown.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (match, key) => {
    return key in replacements ? replacements[key] : match
  })
}

/**
 * Help text shown in the admin contentPages editor. Lists every variable
 * an author can use in policy markdown along with a one-line example.
 */
export const POLICY_VARIABLE_HELP: ReadonlyArray<{ name: string; example: string; source: string }> = [
  { name: "{{storeName}}",                example: "VastuCart",                 source: "Storefront → Branding" },
  { name: "{{contactEmail}}",             example: "support@vastucart.in",     source: "Storefront → Branding" },
  { name: "{{contactPhone}}",             example: "+91 94611 94356",           source: "Storefront → Branding" },
  { name: "{{whatsapp}}",                 example: "+91 94611 94356",           source: "Storefront → Contact" },
  { name: "{{fullAddress}}",              example: "42 Temple Lane, Varanasi…", source: "Storefront → Branding" },
  { name: "{{streetAddress}}",            example: "42 Temple Lane",            source: "Storefront → Branding" },
  { name: "{{addressLocality}}",          example: "Varanasi",                  source: "Storefront → Branding" },
  { name: "{{addressRegion}}",            example: "Uttar Pradesh",             source: "Storefront → Branding" },
  { name: "{{postalCode}}",               example: "221001",                    source: "Storefront → Branding" },
  { name: "{{returnWindowDays}}",         example: "7",                         source: "Shipping → Return Policy" },
  { name: "{{inspectionDays}}",           example: "3-5",                       source: "Shipping → Return Policy" },
  { name: "{{refundDays}}",               example: "7-10",                      source: "Shipping → Return Policy" },
  { name: "{{freeShippingThresholdInr}}", example: "₹999",                      source: "Shipping → Free Shipping" },
  { name: "{{freeShippingThresholdUsd}}", example: "$50",                       source: "Shipping → Free Shipping" },
  { name: "{{codMinOrderInr}}",           example: "₹500",                      source: "Shipping → COD" },
  { name: "{{codMaxOrderInr}}",           example: "₹25,000",                   source: "Shipping → COD" },
  { name: "{{codFee}}",                   example: "no extra charge",           source: "Shipping → COD" },
  { name: "{{founderName}}",              example: "Prashant Kumar",            source: "Storefront → About" },
  { name: "{{legalName}}",                example: "Prashant Kumar",            source: "Payments & Tax → GST" },
  { name: "{{gstin}}",                    example: "08AWUPV3378A1ZY",           source: "Payments & Tax → GST" },
  { name: "{{registeredAddress}}",        example: "VastuCart Premiere Enc, HN 2…", source: "Payments & Tax → GST" },
  { name: "{{wholesaleEmail}}",           example: "wholesale@vastucart.in",   source: "Storefront → Support Emails" },
  { name: "{{returnsEmail}}",             example: "returns@vastucart.in",     source: "Storefront → Support Emails" },
  { name: "{{grievanceEmail}}",           example: "grievance@vastucart.in",   source: "Storefront → Support Emails" },
  { name: "{{privacyEmail}}",             example: "privacy@vastucart.in",     source: "Storefront → Support Emails" },
  { name: "{{legalEmail}}",               example: "legal@vastucart.in",       source: "Storefront → Support Emails" },
  { name: "{{ordersEmail}}",              example: "orders@vastucart.in",       source: "Storefront → Support Emails" },
  { name: "{{clusterDomainsList}}",       example: "- store.vastucart.in\\n- vastucart.in\\n- …", source: "Storefront → Cluster Sites" },
]
