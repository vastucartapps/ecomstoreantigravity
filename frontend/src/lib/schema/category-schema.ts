/**
 * Category (collection) page JSON-LD.
 *
 * Emits a CollectionPage that carries:
 *  - BreadcrumbList (Home → Category)
 *  - ItemList (summary form): the category's products as positioned ListItems
 *    pointing at each product URL. Summary form (url + name only, no nested
 *    price/rating) keeps it compliant — no risk of price/rating mismatch with
 *    the product page, and Google uses it to understand the listing.
 *
 * Server-rendered from the category layout so the structured data is in the
 * initial HTML for crawlers, independent of the client-rendered product grid.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"

export interface CategorySchemaProduct {
  handle: string
  title: string
}

export interface CategorySchemaInput {
  slug: string
  name: string
  description?: string
  products: CategorySchemaProduct[]
}

export function buildCategoryGraph(input: CategorySchemaInput) {
  const pageUrl = `${SITE_URL}/category/${input.slug}`
  const collectionId = `${pageUrl}#collection`

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: input.name, item: pageUrl },
    ],
  }

  const itemList = {
    "@type": "ItemList",
    "@id": `${pageUrl}#products`,
    name: input.name,
    numberOfItems: input.products.length,
    itemListElement: input.products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/product/${p.handle}`,
      name: p.title,
    })),
  }

  const collectionPage: Record<string, unknown> = {
    "@type": "CollectionPage",
    "@id": collectionId,
    url: pageUrl,
    name: input.name,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    breadcrumb: { "@id": breadcrumb["@id"] },
    mainEntity: { "@id": itemList["@id"] },
  }
  if (input.description) collectionPage.description = input.description

  return {
    "@context": "https://schema.org",
    "@graph": [collectionPage, breadcrumb, itemList],
  }
}
