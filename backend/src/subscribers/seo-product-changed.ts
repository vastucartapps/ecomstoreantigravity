/**
 * Unified SEO freshness subscriber (tasks #176 + #159).
 *
 * On any product or category change, immediately:
 *   - revalidate the affected storefront page(s) + nav (Next on-demand ISR)
 *   - ping IndexNow with the changed URL(s)
 *
 * This keeps the sitemap/listings/search-engine indexes in sync with the live
 * catalog within seconds of the owner adding/removing/editing a product —
 * independent of any time-based cache window. Fires alongside the existing GMC
 * and Meta product-sync subscribers (separate concerns, same trigger point).
 *
 * Fails soft: a notification error never affects the catalog write.
 */
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { pingIndexNow, revalidateStorefront, storefrontUrl } from "../lib/seo-notify"

export default async function handleSeoProductChanged({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger") as { warn: (m: string) => void }
  const site = storefrontUrl()
  const id = event.data?.id
  const name = event.name

  try {
    const paths = new Set<string>()
    const urls = new Set<string>()

    const productService = container.resolve(Modules.PRODUCT) as any

    if (name.startsWith("product.") && name !== "product.deleted" && id) {
      const p = await productService
        .retrieveProduct(id, { select: ["handle"] })
        .catch(() => null)
      if (p?.handle) {
        paths.add(`/product/${p.handle}`)
        urls.add(`${site}/product/${p.handle}`)
      }
    } else if (
      name.startsWith("product-category.") &&
      name !== "product-category.deleted" &&
      id
    ) {
      const c = await productService
        .retrieveProductCategory(id, { select: ["handle"] })
        .catch(() => null)
      if (c?.handle) {
        paths.add(`/category/${c.handle}`)
        urls.add(`${site}/category/${c.handle}`)
      }
    }
    // For deletes we can't resolve the (now-gone) handle; the dynamic sitemap
    // drops the URL on next crawl. We still refresh the nav + homepage so the
    // change surfaces immediately, and ping the homepage so engines recrawl.
    paths.add("/")
    urls.add(`${site}/`)

    await Promise.all([
      revalidateStorefront({ paths: [...paths] }, logger),
      pingIndexNow([...urls], logger),
    ])
  } catch (err: any) {
    logger.warn(`[seo-notify] ${name} (${id}) failed: ${err?.message}`)
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
  ],
}
