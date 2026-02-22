import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { syncGmcProductsStep } from "./steps/sync-gmc-products"

type SyncGmcWorkflowInput = {
  filters?: Record<string, unknown>
  limit?: number
  offset?: number
}

export const syncGmcProductsWorkflow = createWorkflow(
  "sync-gmc-products",
  ({ filters, limit, offset }: SyncGmcWorkflowInput) => {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: [
        "id", "title", "handle", "description", "thumbnail", "status", "metadata",
        "images.url",
        "categories.id", "categories.name", "categories.handle", "categories.metadata",
        "tags.value",
        "options.id", "options.title",
        "variants.id", "variants.title", "variants.sku",
        "variants.inventory_quantity", "variants.manage_inventory", "variants.metadata",
        "variants.prices.amount", "variants.prices.currency_code",
        "variants.options.option_id", "variants.options.value",
      ],
      pagination: { take: limit, skip: offset },
      filters,
    })

    const { publishedProducts } = transform(
      { products: products as any },
      (data) => {
        const publishedProducts = data.products.filter(
          (p: any) => p.status === "published"
        )
        return { publishedProducts }
      }
    )

    syncGmcProductsStep({ products: publishedProducts as any })

    return new WorkflowResponse({ count: (products as any[]).length })
  }
)
