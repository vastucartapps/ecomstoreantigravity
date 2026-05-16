import { ModuleOptions } from "./loader/create-content-models"
import { PlainClientAPI } from "contentful-management"
import { ProductDTO, ProductVariantDTO, ProductOptionDTO } from "@medusajs/framework/types"
import { EntryProps } from "contentful-management"
import { MedusaError } from "@medusajs/framework/utils"
import { CanonicalRequest, verifyRequest } from "@contentful/node-apps-toolkit"
import { captureWarning } from "../../lib/error-reporter"

type InjectedDependencies = {
  contentfulManagementClient?: PlainClientAPI
  contentfulDeliveryClient?: any
}

export default class ContentfulModuleService {
  private managementClient: PlainClientAPI | null
  private deliveryClient: any | null
  private options: ModuleOptions

  constructor(
    container: InjectedDependencies,
    options: ModuleOptions
  ) {
    this.managementClient = container.contentfulManagementClient ?? null
    this.deliveryClient = container.contentfulDeliveryClient ?? null
    this.options = {
      ...options,
      default_locale: options.default_locale || "en-US",
    } as ModuleOptions
  }

  private ensureClient(): PlainClientAPI {
    if (!this.managementClient) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Contentful is not configured. Set CONTENTFUL_MANAGEMENT_TOKEN and other credentials."
      )
    }
    return this.managementClient
  }

  async verifyWebhook(request: CanonicalRequest) {
    if (!this.options.webhook_secret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Webhook secret not configured")
    }
    return verifyRequest(this.options.webhook_secret, request, 0)
  }

  async createProduct(product: ProductDTO) {
    const mc = this.ensureClient()

    try {
      const existingEntry = await mc.entry.get({
        environmentId: this.options.environment,
        entryId: product.id,
      })
      return existingEntry
    } catch (_e) {
      // 404 expected — entry does not exist yet, continue to create it
    }

    const productEntry = await mc.entry.createWithId(
      { contentTypeId: "product", entryId: product.id },
      {
        fields: {
          medusaId: { [this.options.default_locale!]: product.id },
          title: { [this.options.default_locale!]: product.title },
          description: product.description
            ? {
                [this.options.default_locale!]: {
                  nodeType: "document",
                  data: {},
                  content: [
                    {
                      nodeType: "paragraph",
                      data: {},
                      content: [{ nodeType: "text", value: product.description, marks: [], data: {} }],
                    },
                  ],
                },
              }
            : undefined,
          subtitle: product.subtitle ? { [this.options.default_locale!]: product.subtitle } : undefined,
          handle: product.handle ? { [this.options.default_locale!]: product.handle } : undefined,
        },
      }
    )

    if (product.options?.length) {
      await this.createProductOption(product.options, productEntry)
    }
    if (product.variants?.length) {
      await this.createProductVariant(product.variants, productEntry)
    }

    await mc.entry.update(
      { entryId: productEntry.sys.id },
      {
        sys: productEntry.sys,
        fields: {
          ...productEntry.fields,
          productVariants: {
            [this.options.default_locale!]: product.variants?.map((v) => ({
              sys: { type: "Link", linkType: "Entry", id: v.id },
            })),
          },
          productOptions: {
            [this.options.default_locale!]: product.options?.map((o) => ({
              sys: { type: "Link", linkType: "Entry", id: o.id },
            })),
          },
        },
      }
    )

    return productEntry
  }

  private async createProductVariant(variants: ProductVariantDTO[], productEntry: EntryProps) {
    const mc = this.ensureClient()
    for (const variant of variants) {
      await mc.entry.createWithId(
        { contentTypeId: "productVariant", entryId: variant.id },
        {
          fields: {
            medusaId: { [this.options.default_locale!]: variant.id },
            title: { [this.options.default_locale!]: variant.title },
            product: {
              [this.options.default_locale!]: {
                sys: { type: "Link", linkType: "Entry", id: productEntry.sys.id },
              },
            },
            productOptionValues: {
              [this.options.default_locale!]: variant.options.map((o: any) => ({
                sys: { type: "Link", linkType: "Entry", id: o.id },
              })),
            },
          },
        }
      )
    }
  }

  private async createProductOption(options: ProductOptionDTO[], productEntry: EntryProps) {
    const mc = this.ensureClient()
    for (const option of options) {
      const valueIds: any[] = []
      for (const value of option.values) {
        await mc.entry.createWithId(
          { contentTypeId: "productOptionValue", entryId: value.id },
          {
            fields: {
              value: { [this.options.default_locale!]: value.value },
              medusaId: { [this.options.default_locale!]: value.id },
            },
          }
        )
        valueIds.push({ sys: { type: "Link", linkType: "Entry", id: value.id } })
      }

      await mc.entry.createWithId(
        { contentTypeId: "productOption", entryId: option.id },
        {
          fields: {
            medusaId: { [this.options.default_locale!]: option.id },
            title: { [this.options.default_locale!]: option.title },
            product: {
              [this.options.default_locale!]: {
                sys: { type: "Link", linkType: "Entry", id: productEntry.sys.id },
              },
            },
            values: { [this.options.default_locale!]: valueIds },
          },
        }
      )
    }
  }

  async deleteProduct(productId: string) {
    const mc = this.ensureClient()
    try {
      const productEntry = await mc.entry.get({
        environmentId: this.options.environment,
        entryId: productId,
      })
      if (!productEntry) return

      try {
        await mc.entry.unpublish({ environmentId: this.options.environment, entryId: productId })
      } catch (_e) {
        // Entry may already be unpublished — safe to proceed with deletion
        captureWarning("contentful: unpublish skipped for product", {
          source: "modules/contentful/service.deleteProduct",
          product_id: productId,
          error: _e instanceof Error ? _e.message : String(_e),
        })
      }
      await mc.entry.delete({ environmentId: this.options.environment, entryId: productId })

      for (const variant of productEntry.fields.productVariants?.[this.options.default_locale!] || []) {
        try {
          await mc.entry.unpublish({ environmentId: this.options.environment, entryId: variant.sys.id })
        } catch (_e) {
          captureWarning("contentful: unpublish skipped for variant", {
            source: "modules/contentful/service.deleteProduct",
            variant_id: variant.sys.id,
            error: _e instanceof Error ? _e.message : String(_e),
          })
        }
        await mc.entry.delete({ environmentId: this.options.environment, entryId: variant.sys.id })
      }

      for (const option of productEntry.fields.productOptions?.[this.options.default_locale!] || []) {
        try {
          await mc.entry.unpublish({ environmentId: this.options.environment, entryId: option.sys.id })
        } catch (_e) {
          captureWarning("contentful: unpublish skipped for option", {
            source: "modules/contentful/service.deleteProduct",
            option_id: option.sys.id,
            error: _e instanceof Error ? _e.message : String(_e),
          })
        }
        await mc.entry.delete({ environmentId: this.options.environment, entryId: option.sys.id })
      }
    } catch (error: any) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Product deletion failed: ${error.message}`)
    }
  }

  async getLocales() {
    const mc = this.ensureClient()
    return await mc.locale.getMany({})
  }

  async getDefaultLocaleCode() {
    return this.options.default_locale
  }

  async list(filter: { id: string | string[]; context?: { locale: string } }) {
    const dc = this.deliveryClient as any
    if (!dc) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Contentful delivery client is not configured.")

    const contentfulProducts = await dc.getEntries({
      limit: 15,
      content_type: "product",
      "fields.medusaId": filter.id,
      locale: filter.context?.locale,
      include: 3,
    })

    return contentfulProducts.items.map((product: any) => {
      const { productVariants: _, productOptions: __, ...productFields } = product.fields
      return {
        ...productFields,
        product_id: product.fields.medusaId,
        variants: product.fields.productVariants?.map((variant: any) => ({
          ...variant.fields,
          product_variant_id: variant.fields.medusaId,
        })),
        options: product.fields.productOptions?.map((option: any) => ({
          ...option.fields,
          product_option_id: option.fields.medusaId,
        })),
      }
    })
  }
}
