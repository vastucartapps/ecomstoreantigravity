/**
 * GET /store/gmc-feed
 *
 * Returns a Google Shopping XML product feed (RSS 2.0 with g: namespace).
 * Public route — no auth required. Submit this URL to Google Merchant Centre.
 *
 * Feed URL: https://sapi.vastucart.in/store/gmc-feed
 *
 * Each published product variant becomes a separate <item>.
 * Prices are pulled from variant.prices (INR, major units).
 * Metadata from product.metadata.merchant_centre is used for brand/condition/GTIN.
 * Category metadata (google_product_category, custom_label_*) is included.
 *
 * Cache-Control: 1 hour (Google crawls ~24 h, but 1 h keeps feed fresh)
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { buildXmlFeed } from "../../../lib/gmc-transformer"
import type { RawMedusaProduct } from "../../../lib/gmc-transformer"
import { fetchBrandFromStore } from "../../../lib/brand-from-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const productModule = req.scope.resolve(Modules.PRODUCT) as any

    // Fetch all published products with variant prices + category metadata
    const [products] = await productModule.listAndCount(
      { status: "published" },
      {
        take: 5000,
        skip: 0,
        relations: [
          "variants",
          "variants.prices",
          "variants.options",
          "images",
          "options",
          "categories",
          "tags",
        ],
        select: [
          "id", "title", "handle", "description", "thumbnail", "status", "metadata",
          "variants.id", "variants.title", "variants.sku",
          "variants.inventory_quantity", "variants.manage_inventory", "variants.metadata",
          "variants.prices.amount", "variants.prices.currency_code",
          "variants.options.option_id", "variants.options.value",
          "images.url",
          "options.id", "options.title",
          "categories.id", "categories.name", "categories.handle", "categories.metadata",
          "tags.value",
        ],
      }
    )

    // Brand falls through admin-saved storeName so renaming the store
    // updates GMC feed brand for products without merchant_centre.brand.
    const brand = await fetchBrandFromStore(req.scope)
    const xml = buildXmlFeed(products as RawMedusaProduct[], brand.storeName)

    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600")
    res.send(xml)
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate GMC feed", detail: err?.message })
  }
}
