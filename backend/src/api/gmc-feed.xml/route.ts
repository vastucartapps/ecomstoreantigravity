/**
 * GET /gmc-feed.xml
 *
 * Public unauthenticated RSS 2.0 XML feed for Google Merchant Center.
 * Placed outside /store/* to bypass Medusa publishable API key requirements.
 */
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { buildXmlFeed } from "../../lib/gmc-transformer"
import type { RawMedusaProduct } from "../../lib/gmc-transformer"
import { fetchBrandFromStore } from "../../lib/brand-from-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const productModule = req.scope.resolve(Modules.PRODUCT) as any

    const [products] = await productModule.listAndCountProducts(
      { status: "published" },
      {
        take: 5000,
        skip: 0,
        relations: [
          "variants",
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
    const xml = buildXmlFeed(products as RawMedusaProduct[], brand.storeName)

    res.setHeader("Content-Type", "application/xml; charset=utf-8")
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600")
    res.send(xml)
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate GMC feed", detail: err?.message })
  }
}
