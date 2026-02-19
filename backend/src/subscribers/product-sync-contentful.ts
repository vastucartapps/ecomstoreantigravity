import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/framework"
import { createProductsContentfulWorkflow } from "../workflows/create-products-contentful"

export default async function handleProductCreateContentful({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await createProductsContentfulWorkflow(container).run({
    input: { product_ids: [data.id] },
  })
}

export const config: SubscriberConfig = {
  event: "product.created",
}
