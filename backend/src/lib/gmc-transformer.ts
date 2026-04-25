/**
 * Google Merchant Centre — Medusa product transformer.
 *
 * Patterns from MTSD spec:
 *  - offerId   = variant.sku (or fallback to handle_variantId)
 *  - itemGroupId = product.id  (groups all variants under one parent)
 *  - title     = "{brand} {gender} {title} {color} {size}".trim()
 *  - google_product_category = INTEGER taxonomy ID (not string path)
 *  - identifierExists = false when no GTIN present
 *  - preorder logic: stock=0 + metadata.availability_date set
 *  - targetCountry = "IN", feedLabel = "IN", contentLanguage = "en"
 *  - prices in major units (INR) — Medusa stores in paise, divide /100
 */

import { brandFallback } from "./brand-from-store"

const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL || "https://store.vastucart.in"
/** Last-resort brand fallback. The async route handler should pass an
 *  admin-sourced brand via `defaultBrand` to override. */
const HARDCODED_BRAND = brandFallback().storeName
const FEED_COUNTRY = "IN"
const FEED_LANGUAGE = "en"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GmcProduct {
  offerId: string
  itemGroupId: string
  title: string
  description: string
  link: string
  imageLink: string
  additionalImageLinks: string[]
  availability: "in stock" | "out of stock" | "preorder" | "backorder"
  availabilityDate?: string
  price: { value: string; currency: string }
  salePrice?: { value: string; currency: string }
  brand: string
  condition: "new" | "used" | "refurbished"
  gtin?: string
  mpn?: string
  identifierExists: boolean
  googleProductCategory?: string // taxonomy INT as string, or label
  productType?: string
  ageGroup?: "adult" | "all ages" | "teen" | "kids" | "toddler" | "infant" | "newborn"
  gender?: "male" | "female" | "unisex"
  color?: string
  size?: string
  targetCountry: string
  feedLabel: string
  contentLanguage: string
  channel: "online"
  shippingLabel?: string
  customLabel0?: string
  customLabel1?: string
  customLabel2?: string
  customLabel3?: string
  customLabel4?: string
}

export interface RawMedusaProduct {
  id: string
  title: string
  handle: string
  description?: string
  thumbnail?: string
  images?: { url: string }[]
  status: string
  metadata?: Record<string, unknown>
  categories?: { id: string; name: string; handle: string; metadata?: Record<string, unknown> }[]
  tags?: { value: string }[]
  options?: { id: string; title: string }[]
  variants: RawMedusaVariant[]
}

export interface RawMedusaVariant {
  id: string
  title: string
  sku?: string
  inventory_quantity?: number
  manage_inventory?: boolean
  metadata?: Record<string, unknown>
  prices?: { amount: number; currency_code: string }[]
  options?: { option_id: string; value: string }[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function cleanText(str: string): string {
  return (str || "").replace(/\s+/g, " ").trim()
}

/** Resolve variant option value by option title (e.g. "Color" → "Red") */
function getOptionValue(
  product: RawMedusaProduct,
  variant: RawMedusaVariant,
  optionTitle: string
): string {
  if (!Array.isArray(variant.options)) return ""
  const optMap: Record<string, string> = {}
  for (const opt of product.options || []) optMap[opt.id] = opt.title
  for (const ov of variant.options) {
    if (optMap[ov.option_id]?.toLowerCase() === optionTitle.toLowerCase()) {
      return ov.value || ""
    }
  }
  return ""
}

/** Get INR price from variant prices array. Returns price in major units (₹). */
function resolvePrice(variant: RawMedusaVariant): number {
  const prices = variant.prices || []
  const inr = prices.find((p) => p.currency_code?.toLowerCase() === "inr")
  const any = prices[0]
  const amount = inr?.amount ?? any?.amount ?? 0
  return amount / 100
}

/** Build GMC-compliant title from MTSD spec: {brand} {gender} {title} {color} {size} */
function buildTitle(
  product: RawMedusaProduct,
  variant: RawMedusaVariant,
  brand: string,
  gender: string
): string {
  const color = getOptionValue(product, variant, "Color")
  const size = getOptionValue(product, variant, "Size")

  const parts = [brand, gender, product.title, color, size]
    .map(cleanText)
    .filter(Boolean)

  // Deduplicate consecutive identical tokens
  const deduped: string[] = []
  for (const part of parts) {
    if (deduped[deduped.length - 1] !== part) deduped.push(part)
  }

  return deduped.join(" ").slice(0, 150) // GMC title max 150 chars
}

/** Determine availability based on stock + preorder metadata */
function resolveAvailability(
  variant: RawMedusaVariant,
  product: RawMedusaProduct
): { availability: GmcProduct["availability"]; availabilityDate?: string } {
  const qty = variant.inventory_quantity ?? 0
  const managed = variant.manage_inventory !== false
  const inStock = !managed || qty > 0
  const availDate = product.metadata?.availability_date as string | undefined

  if (inStock) return { availability: "in stock" }
  if (availDate) return { availability: "preorder", availabilityDate: availDate }
  return { availability: "out of stock" }
}

// ─── Main transformer ─────────────────────────────────────────────────────────

/**
 * Transform a single Medusa product + variant into a GMC product payload.
 */
export function toGmcPayload(
  product: RawMedusaProduct,
  variant: RawMedusaVariant,
  defaultBrand: string = HARDCODED_BRAND
): GmcProduct {
  const meta = (product.metadata || {}) as Record<string, unknown>
  const mc = (meta.merchant_centre || {}) as Record<string, string>
  const catMeta = (product.categories?.[0]?.metadata || {}) as Record<string, string>

  const brand = cleanText(mc.brand || defaultBrand)
  const gender = cleanText(mc.gender || "")
  const ageGroup = (mc.ageGroup || "adult") as GmcProduct["ageGroup"]
  const condition = (mc.condition || "new") as GmcProduct["condition"]
  const gtin = cleanText(mc.gtin || "")
  const mpn = cleanText(mc.mpn || "")
  // google_product_category: prefer INT taxonomy ID
  const googleCategory = cleanText(mc.googleCategory || catMeta.google_product_category || "")

  const color = getOptionValue(product, variant, "Color")
  const size = getOptionValue(product, variant, "Size")

  const title = buildTitle(product, variant, brand, gender)
  const offerId = cleanText(variant.sku || `${product.handle}_${variant.id}`)
  const price = resolvePrice(variant)
  const { availability, availabilityDate } = resolveAvailability(variant, product)

  const allImages = [
    product.thumbnail,
    ...(product.images || []).map((i) => i.url),
  ].filter(Boolean) as string[]
  const imageLink = allImages[0] || ""
  const additionalImageLinks = allImages.slice(1, 10)

  const productUrl = `${STORE_URL}/product/${product.handle}`

  // Category for productType from category name
  const productType = product.categories
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(" > ")

  // Custom labels from category metadata
  const customLabel0 = cleanText(catMeta.custom_label_0 || "")
  const customLabel1 = cleanText(catMeta.custom_label_1 || "")
  const customLabel2 = cleanText(catMeta.custom_label_2 || "")
  const customLabel3 = cleanText(catMeta.custom_label_3 || "")
  const customLabel4 = cleanText(catMeta.custom_label_4 || "")

  return {
    offerId,
    itemGroupId: product.id,
    title,
    description: cleanText(product.description || product.title).slice(0, 5000),
    link: productUrl,
    imageLink,
    additionalImageLinks,
    availability,
    ...(availabilityDate ? { availabilityDate } : {}),
    price: { value: price.toFixed(2), currency: "INR" },
    brand,
    condition,
    ...(gtin ? { gtin } : {}),
    ...(mpn ? { mpn } : {}),
    identifierExists: !!(gtin || mpn),
    ...(googleCategory ? { googleProductCategory: googleCategory } : {}),
    ...(productType ? { productType } : {}),
    ...(ageGroup ? { ageGroup } : {}),
    ...(gender ? { gender: gender.toLowerCase() as GmcProduct["gender"] } : {}),
    ...(color ? { color } : {}),
    ...(size ? { size } : {}),
    targetCountry: FEED_COUNTRY,
    feedLabel: FEED_COUNTRY,
    contentLanguage: FEED_LANGUAGE,
    channel: "online",
    ...(customLabel0 ? { customLabel0 } : {}),
    ...(customLabel1 ? { customLabel1 } : {}),
    ...(customLabel2 ? { customLabel2 } : {}),
    ...(customLabel3 ? { customLabel3 } : {}),
    ...(customLabel4 ? { customLabel4 } : {}),
  }
}

/**
 * Build a Google Shopping XML feed (RSS 2.0 with g: namespace) from a list
 * of raw Medusa products. Each published variant becomes a separate <item>.
 */
export function buildXmlFeed(
  products: RawMedusaProduct[],
  storeName: string = HARDCODED_BRAND
): string {
  const storeUrl = STORE_URL

  const items: string[] = []

  for (const product of products) {
    if (product.status !== "published") continue

    for (const variant of product.variants || []) {
      const gmc = toGmcPayload(product, variant, storeName)
      const price = `${gmc.price.value} ${gmc.price.currency}`

      let xml = `    <item>\n`
      xml += `      <g:id>${escapeXml(gmc.offerId)}</g:id>\n`
      xml += `      <g:item_group_id>${escapeXml(gmc.itemGroupId)}</g:item_group_id>\n`
      xml += `      <title>${escapeXml(gmc.title)}</title>\n`
      xml += `      <description>${escapeXml(gmc.description)}</description>\n`
      xml += `      <link>${escapeXml(gmc.link)}</link>\n`
      if (gmc.imageLink) {
        xml += `      <g:image_link>${escapeXml(gmc.imageLink)}</g:image_link>\n`
      }
      for (const img of gmc.additionalImageLinks.slice(0, 9)) {
        xml += `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`
      }
      xml += `      <g:availability>${gmc.availability}</g:availability>\n`
      if (gmc.availabilityDate) {
        xml += `      <g:availability_date>${gmc.availabilityDate}</g:availability_date>\n`
      }
      xml += `      <g:price>${escapeXml(price)}</g:price>\n`
      xml += `      <g:brand>${escapeXml(gmc.brand)}</g:brand>\n`
      xml += `      <g:condition>${gmc.condition}</g:condition>\n`
      if (gmc.gtin) xml += `      <g:gtin>${escapeXml(gmc.gtin)}</g:gtin>\n`
      if (gmc.mpn) xml += `      <g:mpn>${escapeXml(gmc.mpn)}</g:mpn>\n`
      xml += `      <g:identifier_exists>${gmc.identifierExists ? "yes" : "no"}</g:identifier_exists>\n`
      if (gmc.googleProductCategory) {
        xml += `      <g:google_product_category>${escapeXml(gmc.googleProductCategory)}</g:google_product_category>\n`
      }
      if (gmc.productType) {
        xml += `      <g:product_type>${escapeXml(gmc.productType)}</g:product_type>\n`
      }
      if (gmc.ageGroup) xml += `      <g:age_group>${gmc.ageGroup}</g:age_group>\n`
      if (gmc.gender) xml += `      <g:gender>${gmc.gender}</g:gender>\n`
      if (gmc.color) xml += `      <g:color>${escapeXml(gmc.color)}</g:color>\n`
      if (gmc.size) xml += `      <g:size>${escapeXml(gmc.size)}</g:size>\n`
      // Shipping: free within India by default
      xml += `      <g:shipping>\n`
      xml += `        <g:country>IN</g:country>\n`
      xml += `        <g:price>0.00 INR</g:price>\n`
      xml += `      </g:shipping>\n`
      if (gmc.customLabel0) xml += `      <g:custom_label_0>${escapeXml(gmc.customLabel0)}</g:custom_label_0>\n`
      if (gmc.customLabel1) xml += `      <g:custom_label_1>${escapeXml(gmc.customLabel1)}</g:custom_label_1>\n`
      if (gmc.customLabel2) xml += `      <g:custom_label_2>${escapeXml(gmc.customLabel2)}</g:custom_label_2>\n`
      if (gmc.customLabel3) xml += `      <g:custom_label_3>${escapeXml(gmc.customLabel3)}</g:custom_label_3>\n`
      if (gmc.customLabel4) xml += `      <g:custom_label_4>${escapeXml(gmc.customLabel4)}</g:custom_label_4>\n`
      xml += `    </item>`

      items.push(xml)
    }
  }

  const now = new Date().toUTCString()

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">`,
    `  <channel>`,
    `    <title>${storeName} Product Feed</title>`,
    `    <link>${storeUrl}</link>`,
    `    <description>${storeName} — Vastu-Aligned Home &amp; Living</description>`,
    `    <pubDate>${now}</pubDate>`,
    ...items,
    `  </channel>`,
    `</rss>`,
  ].join("\n")
}
