/**
 * Meta Commerce Catalogue — Medusa product transformer.
 *
 * Transforms Medusa products + variants into Meta catalogue items.
 * Also builds a TSV (tab-separated values) feed for Meta Commerce Manager
 * scheduled feed imports.
 *
 * Field mapping:
 *  - retailer_id = variant.sku || `${product.handle}_${variant.id}`
 *  - item_group_id = product.id  (groups all variants)
 *  - title = "{brand} {gender} {title} {color} {size}".trim() — MTSD style
 *  - price = "499.00 INR" — major units (Medusa stores paise, divide /100)
 *  - availability = stock-based; preorder when availability_date metadata set
 *  - image_link = first image URL (thumbnail or first in images array)
 *  - additional_image_link = remaining images (up to 9), comma-separated
 */

import type { MetaProduct } from "./meta-client"

const STORE_URL = process.env.STORE_URL || "https://store.vastucart.in"
const DEFAULT_BRAND = "VastuCart"

// ─── Shared raw Medusa types (same as gmc-transformer) ────────────────────────

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

function cleanText(str: string): string {
  return (str || "").replace(/\s+/g, " ").trim()
}

/** Strip basic HTML tags for Meta description field */
function stripHtml(str: string): string {
  return (str || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
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

/** Get INR price from variant prices array. Returns price in MAJOR units (₹). */
function resolvePrice(variant: RawMedusaVariant): number {
  const prices = variant.prices || []
  const inr = prices.find((p) => p.currency_code?.toLowerCase() === "inr")
  const any = prices[0]
  const amount = inr?.amount ?? any?.amount ?? 0
  return amount / 100
}

/**
 * Build Meta-compliant title from MTSD spec: {brand} {gender} {title} {color} {size}
 * Max 150 chars. Consecutive duplicate tokens are deduplicated.
 */
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

  const deduped: string[] = []
  for (const part of parts) {
    if (deduped[deduped.length - 1] !== part) deduped.push(part)
  }

  return deduped.join(" ").slice(0, 150)
}

/** Determine Meta availability based on stock + preorder metadata */
function resolveAvailability(
  variant: RawMedusaVariant,
  product: RawMedusaProduct
): MetaProduct["availability"] {
  const qty = variant.inventory_quantity ?? 0
  const managed = variant.manage_inventory !== false
  const inStock = !managed || qty > 0
  const availDate = product.metadata?.availability_date as string | undefined

  if (inStock) return "in stock"
  if (availDate) return "preorder"
  return "out of stock"
}

// ─── Main transformer ─────────────────────────────────────────────────────────

/**
 * Transform a single Medusa product + variant into a Meta catalogue item.
 */
export function toMetaProduct(
  product: RawMedusaProduct,
  variant: RawMedusaVariant
): MetaProduct {
  const meta = (product.metadata || {}) as Record<string, unknown>
  const mc = (meta.merchant_centre || {}) as Record<string, string>
  const catMeta = (product.categories?.[0]?.metadata || {}) as Record<string, string>

  const brand = cleanText(mc.brand || DEFAULT_BRAND)
  const gender = cleanText(mc.gender || "")
  const ageGroup = cleanText(mc.ageGroup || "adult")

  const color = getOptionValue(product, variant, "Color")
  const size = getOptionValue(product, variant, "Size")

  const title = buildTitle(product, variant, brand, gender)
  const retailerId = cleanText(variant.sku || `${product.handle}_${variant.id}`)
  const price = resolvePrice(variant)
  const availability = resolveAvailability(variant, product)

  // Build image list: thumbnail first, then images array, deduplicated
  const allImages = [
    product.thumbnail,
    ...(product.images || []).map((i) => i.url),
  ].filter(Boolean) as string[]
  const imageLink = allImages[0] || ""
  const additionalImages = allImages.slice(1, 10) // Meta allows up to 9 additional

  const productUrl = `${STORE_URL}/product/${product.handle}`

  // Category path from Medusa categories
  const productType = product.categories
    ?.map((c) => c.name)
    .filter(Boolean)
    .join(" > ")

  // Custom labels from category metadata (same pattern as GMC)
  const customLabel0 = cleanText(
    catMeta.custom_label_0 ||
    (product.tags?.[0]?.value || "")
  )
  const customLabel1 = cleanText(catMeta.custom_label_1 || "")
  const customLabel2 = cleanText(catMeta.custom_label_2 || "")
  const customLabel3 = cleanText(catMeta.custom_label_3 || "")

  // Description: strip HTML, limit to 5000 chars
  const description = stripHtml(product.description || product.title).slice(0, 5000)

  const result: MetaProduct = {
    retailer_id: retailerId,
    link: productUrl,
    title,
    description,
    image_link: imageLink,
    availability,
    condition: "new",
    // Meta price format: "499.00 INR" (major units + space + currency)
    price: `${price.toFixed(2)} INR`,
    brand,
    item_group_id: product.id,
  }

  if (additionalImages.length > 0) {
    result.additional_image_link = additionalImages.join(",")
  }
  if (productType) result.product_type = productType
  if (ageGroup) result.age_group = ageGroup
  if (gender) result.gender = gender.toLowerCase()
  if (color) result.color = color
  if (size) result.size = size
  if (customLabel0) result.custom_label_0 = customLabel0
  if (customLabel1) result.custom_label_1 = customLabel1
  if (customLabel2) result.custom_label_2 = customLabel2
  if (customLabel3) result.custom_label_3 = customLabel3

  return result
}

// ─── TSV feed builder ─────────────────────────────────────────────────────────

const TSV_HEADERS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "additional_image_link",
  "item_group_id",
  "color",
  "size",
  "gender",
  "age_group",
  "product_type",
  "custom_label_0",
]

/**
 * Escape a field for TSV — replace tabs and newlines with spaces.
 */
function tsvEscape(val: string | undefined): string {
  return (val || "").replace(/\t/g, " ").replace(/\n/g, " ").replace(/\r/g, "")
}

/**
 * Build a Meta-compatible TSV product feed (tab-separated values).
 * Returns a string with header row + one row per published variant.
 * Meta Commerce Manager accepts this format for scheduled feed imports.
 */
export function buildMetaFeed(products: RawMedusaProduct[]): string {
  const rows: string[] = [TSV_HEADERS.join("\t")]

  for (const product of products) {
    if (product.status !== "published") continue

    for (const variant of product.variants || []) {
      const p = toMetaProduct(product, variant)

      const row = [
        tsvEscape(p.retailer_id),
        tsvEscape(p.title),
        tsvEscape(p.description),
        tsvEscape(p.availability),
        tsvEscape(p.condition),
        tsvEscape(p.price),
        tsvEscape(p.link),
        tsvEscape(p.image_link),
        tsvEscape(p.brand),
        tsvEscape(p.additional_image_link),
        tsvEscape(p.item_group_id),
        tsvEscape(p.color),
        tsvEscape(p.size),
        tsvEscape(p.gender),
        tsvEscape(p.age_group),
        tsvEscape(p.product_type),
        tsvEscape(p.custom_label_0),
      ].join("\t")

      rows.push(row)
    }
  }

  return rows.join("\n")
}
