/**
 * Meta Graph API v21.0 — lightweight catalogue sync client.
 *
 * Auth: System User Access Token (permanent, from Meta Business Suite).
 * Stored in store.metadata.integrations_config.integrations[id="meta"].configFields.accessToken
 *
 * The token is passed as a query param (?access_token=) — Meta's standard auth pattern.
 *
 * Usage:
 *   const client = new MetaClient(catalogId, accessToken)
 *   await client.batchUpsert(products)
 *   await client.deleteProduct(retailerId)
 *   const diag = await client.getCatalogDiagnostics()
 */

const GRAPH_API = "https://graph.facebook.com/v21.0"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetaProduct {
  /** Unique SKU — must match retailer_id used at insert time */
  retailer_id: string
  /** Full product URL on the storefront */
  link: string
  /** Main display title (max 150 chars) */
  title: string
  /** Product description (max 5000 chars) */
  description: string
  /** Primary image URL */
  image_link: string
  /** Availability string */
  availability: "in stock" | "out of stock" | "preorder" | "discontinued"
  /** Always "new" for new goods */
  condition: "new" | "used" | "refurbished"
  /**
   * Price in format "499.00 INR" — major units + space + ISO 4217 currency.
   * Medusa stores in paise, divide by 100 before building this string.
   */
  price: string
  /** Brand name */
  brand: string
  /** Groups all variants of the same product — use product.id */
  item_group_id: string
  /** Comma-separated additional image URLs (up to 9 extra) */
  additional_image_link?: string
  /** Sale price in same format as price, if discounted */
  sale_price?: string
  /** Google product taxonomy path or Meta category */
  category?: string
  /** Category breadcrumb path, e.g. "Home > Décor" */
  product_type?: string
  gender?: string
  age_group?: string
  color?: string
  size?: string
  custom_label_0?: string
  custom_label_1?: string
  custom_label_2?: string
  custom_label_3?: string
}

export interface MetaBatchRequest {
  allow_upsert: boolean
  item_type: "PRODUCT_ITEM"
  requests: Array<{
    method: "UPDATE" | "DELETE"
    retailer_id: string
    data?: MetaProduct
  }>
}

export interface MetaConfig {
  catalogId: string
  accessToken: string
  isConnected: boolean
}

// ─── Client ───────────────────────────────────────────────────────────────────

export class MetaClient {
  private catalogId: string
  private accessToken: string

  constructor(catalogId: string, accessToken: string) {
    this.catalogId = catalogId
    this.accessToken = accessToken
  }

  private authParam(): string {
    return `access_token=${encodeURIComponent(this.accessToken)}`
  }

  /**
   * Batch upsert products to Meta Commerce Catalogue.
   * Splits into chunks of 50 (Meta's recommended batch size for items_batch).
   * Uses method: "UPDATE" with allow_upsert: true for insert-or-update semantics.
   */
  async batchUpsert(products: MetaProduct[]): Promise<{ errors: string[] }> {
    const CHUNK = 50
    const errors: string[] = []

    for (let i = 0; i < products.length; i += CHUNK) {
      const chunk = products.slice(i, i + CHUNK)

      const body: MetaBatchRequest = {
        allow_upsert: true,
        item_type: "PRODUCT_ITEM",
        requests: chunk.map((p) => ({
          method: "UPDATE",
          retailer_id: p.retailer_id,
          data: p,
        })),
      }

      const url = `${GRAPH_API}/${this.catalogId}/items_batch?${this.authParam()}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text()
        errors.push(`Meta batch ${i}-${i + chunk.length} failed ${res.status}: ${text}`)
        continue
      }

      const data = (await res.json()) as {
        handles?: string[]
        error?: { message: string }
      }
      if (data.error) {
        errors.push(data.error.message)
      }
    }

    return { errors }
  }

  /**
   * Delete a product variant from the Meta catalogue by retailer_id (SKU).
   * Uses method: "DELETE" in items_batch.
   */
  async deleteProduct(retailerId: string): Promise<void> {
    const body: MetaBatchRequest = {
      allow_upsert: false,
      item_type: "PRODUCT_ITEM",
      requests: [
        { method: "DELETE", retailer_id: retailerId },
      ],
    }

    const url = `${GRAPH_API}/${this.catalogId}/items_batch?${this.authParam()}`
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      // Treat "item not found" as success — already gone
      if (!text.includes("item_not_found") && !text.includes("does not exist")) {
        throw new Error(`Meta delete failed ${res.status}: ${text}`)
      }
    }
  }

  /**
   * Fetch catalogue diagnostics — errors and warnings reported by Meta.
   * Returns structured list of issues for the admin error report.
   */
  async getCatalogDiagnostics(): Promise<{
    warnings: { productId: string; title: string; issues: string[] }[]
    total: number
  }> {
    const fields = "affected_items,error_type,severity,title"
    const url = `${GRAPH_API}/${this.catalogId}/diagnostics?fields=${fields}&${this.authParam()}`
    const res = await fetch(url)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Meta diagnostics failed ${res.status}: ${text}`)
    }

    const data = (await res.json()) as {
      data?: Array<{
        title?: string
        error_type?: string
        severity?: string
        affected_items?: {
          data?: Array<{ retailer_id: string; errors?: string[] }>
          summary?: { total_count: number }
        }
      }>
      paging?: unknown
    }

    const warnings: { productId: string; title: string; issues: string[] }[] = []
    let total = 0

    for (const diag of data.data || []) {
      const items = diag.affected_items?.data || []
      total += diag.affected_items?.summary?.total_count || items.length

      for (const item of items) {
        warnings.push({
          productId: item.retailer_id,
          title: item.retailer_id,
          issues: [diag.title || diag.error_type || "Unknown issue", ...(item.errors || [])],
        })
      }
    }

    return { warnings, total }
  }
}

// ─── Config reader ────────────────────────────────────────────────────────────

/**
 * Read Meta catalogue config from store metadata integrations_config.
 * Returns null if not configured or not connected.
 */
export async function readMetaConfig(
  storeService: any
): Promise<MetaConfig | null> {
  try {
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.integrations_config
    if (!cfg) return null

    const metaInteg = (cfg.integrations || []).find((i: any) => i.id === "meta")
    if (!metaInteg?.isConnected) return null

    const { catalogId = "", accessToken = "" } = metaInteg.configFields || {}

    if (!catalogId || !accessToken) return null

    return { catalogId, accessToken, isConnected: true }
  } catch {
    return null
  }
}
