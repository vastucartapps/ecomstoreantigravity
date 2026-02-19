import { LoaderOptions } from "@medusajs/framework/types"
import { asValue } from "@medusajs/framework/awilix"
import { createClient } from "contentful-management"
import { MedusaError } from "@medusajs/framework/utils"

const { createClient: createDeliveryClient } = require("contentful")

export type ModuleOptions = {
  management_access_token: string
  delivery_token: string
  space_id: string
  environment: string
  default_locale?: string
  webhook_secret: string
}

export default async function syncContentModelsLoader({
  container,
  options,
}: LoaderOptions<ModuleOptions>) {
  const logger = container.resolve("logger")

  if (
    !options?.management_access_token ||
    !options?.delivery_token ||
    !options?.space_id ||
    !options?.environment
  ) {
    logger.warn("Contentful credentials not configured — skipping module initialization")
    container.register({
      contentfulManagementClient: asValue(null),
      contentfulDeliveryClient: asValue(null),
    })
    return
  }

  try {
    const managementClient = createClient(
      { accessToken: options.management_access_token },
      {
        type: "plain",
        defaults: {
          spaceId: options.space_id,
          environmentId: options.environment,
        },
      }
    )

    const deliveryClient = createDeliveryClient({
      accessToken: options.delivery_token,
      space: options.space_id,
      environment: options.environment,
    })

    await createProductContentType(managementClient)
    await createProductVariantContentType(managementClient)
    await createProductOptionContentType(managementClient)
    await createProductOptionValueContentType(managementClient)

    container.register({
      contentfulManagementClient: asValue(managementClient),
      contentfulDeliveryClient: asValue(deliveryClient),
    })

    logger.info("Connected to Contentful")
  } catch (error) {
    logger.error(`Contentful connection failed: ${error}`)
    throw error
  }
}

async function createProductContentType(managementClient: any) {
  try {
    await managementClient.contentType.get({ contentTypeId: "product" })
  } catch (_error) {
    const contentType = await managementClient.contentType.createWithId(
      { contentTypeId: "product" },
      {
        name: "Product",
        displayField: "title",
        fields: [
          { id: "title", name: "Title", type: "Symbol", required: true, localized: true },
          { id: "handle", name: "Handle", type: "Symbol", required: true, localized: false },
          { id: "medusaId", name: "Medusa ID", type: "Symbol", required: true, localized: false },
          { id: "description", name: "Description", type: "RichText", localized: true, required: true },
          { id: "subtitle", name: "Subtitle", type: "Symbol", localized: true, required: false },
          { id: "images", name: "Images", type: "Array", items: { type: "Link", linkType: "Asset" }, localized: true, required: false },
          { id: "productVariants", name: "Product Variants", type: "Array", localized: false, required: false, items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["productVariant"] }] } },
          { id: "productOptions", name: "Product Options", type: "Array", localized: false, required: false, items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["productOption"] }] } },
        ],
      }
    )
    await managementClient.contentType.publish({ contentTypeId: "product" }, contentType)
  }
}

async function createProductVariantContentType(managementClient: any) {
  try {
    await managementClient.contentType.get({ contentTypeId: "productVariant" })
  } catch (_error) {
    const contentType = await managementClient.contentType.createWithId(
      { contentTypeId: "productVariant" },
      {
        name: "Product Variant",
        displayField: "title",
        fields: [
          { id: "title", name: "Title", type: "Symbol", required: true, localized: true },
          { id: "product", name: "Product", type: "Link", linkType: "Entry", required: true, localized: false, validations: [{ linkContentType: ["product"] }] },
          { id: "medusaId", name: "Medusa ID", type: "Symbol", required: true, localized: false },
          { id: "productOptionValues", name: "Product Option Values", type: "Array", localized: false, required: false, items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["productOptionValue"] }] } },
        ],
      }
    )
    await managementClient.contentType.publish({ contentTypeId: "productVariant" }, contentType)
  }
}

async function createProductOptionContentType(managementClient: any) {
  try {
    await managementClient.contentType.get({ contentTypeId: "productOption" })
  } catch (_error) {
    const contentType = await managementClient.contentType.createWithId(
      { contentTypeId: "productOption" },
      {
        name: "Product Option",
        displayField: "title",
        fields: [
          { id: "title", name: "Title", type: "Symbol", required: true, localized: true },
          { id: "product", name: "Product", type: "Link", linkType: "Entry", required: true, localized: false, validations: [{ linkContentType: ["product"] }] },
          { id: "medusaId", name: "Medusa ID", type: "Symbol", required: true, localized: false },
          { id: "values", name: "Values", type: "Array", required: false, localized: false, items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["productOptionValue"] }] } },
        ],
      }
    )
    await managementClient.contentType.publish({ contentTypeId: "productOption" }, contentType)
  }
}

async function createProductOptionValueContentType(managementClient: any) {
  try {
    await managementClient.contentType.get({ contentTypeId: "productOptionValue" })
  } catch (_error) {
    const contentType = await managementClient.contentType.createWithId(
      { contentTypeId: "productOptionValue" },
      {
        name: "Product Option Value",
        displayField: "value",
        fields: [
          { id: "value", name: "Value", type: "Symbol", required: true, localized: true },
          { id: "medusaId", name: "Medusa ID", type: "Symbol", required: true, localized: false },
        ],
      }
    )
    await managementClient.contentType.publish({ contentTypeId: "productOptionValue" }, contentType)
  }
}
