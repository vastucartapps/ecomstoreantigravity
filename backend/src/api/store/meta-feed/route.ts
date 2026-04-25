/**
 * GET /store/meta-feed
 *
 * Returns a Meta Commerce-compatible TSV (tab-separated values) product feed.
 * Public route — no auth required. Submit this URL to Meta Commerce Manager
 * as a scheduled feed data source.
 *
 * Feed URL: https://sapi.vastucart.in/store/meta-feed
 *
 * Each published product variant becomes a separate row.
 * Prices are pulled from variant.prices (INR, major units — Medusa stores paise).
 * Metadata from product.metadata.merchant_centre is used for brand/gender.
 * Category metadata (custom_label_*) is included.
 *
 * Cache-Control: 1 hour (Meta crawls ~24 h, but 1 h keeps feed fresh)
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { buildMetaFeed } from "../../../lib/meta-transformer"
import type { RawMedusaProduct } from "../../../lib/meta-transformer"
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

    const brand = await fetchBrandFromStore(req.scope)
    const tsv = buildMetaFeed(products as RawMedusaProduct[], brand.storeName)

    res.setHeader("Content-Type", "text/tab-separated-values; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600")
    res.send(tsv)
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate Meta feed", detail: err?.message })
  }
}
