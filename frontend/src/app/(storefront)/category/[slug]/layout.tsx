import type { Metadata } from "next"
import type { ReactNode } from "react"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"
import { JsonLd } from "@/components/JsonLd"
import { buildCategoryGraph } from "@/lib/schema/category-schema"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const b = await fetchBrandingForMetadata()

  try {
    const res = await fetch(
      `${BACKEND_URL}/store/product-categories?handle=${encodeURIComponent(slug)}&fields=id,name,handle,metadata,description`,
      {
        headers: { "x-publishable-api-key": PUB_KEY },
        next: { revalidate: 3600 },
      }
    )
    const data = await res.json()
    const category = data.product_categories?.[0]

    if (!category) return { title: "Category", openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } }

    const name = category.name
    const title = `${name} — Authentic Spiritual Products`
    const description =
      category.metadata?.description ||
      category.description ||
      `Shop authentic ${name} at ${b.storeName}. Premium quality spiritual products delivered across India.`
    const heroImage = category.metadata?.hero_image || category.metadata?.image_url || ""
    const url = `${b.siteUrl}/category/${slug}`

    return {
      title,
      description: description.slice(0, 160),
      alternates: { canonical: url },
      openGraph: {
        title,
        description: description.slice(0, 160),
        url,
        type: "website",
        images: heroImage
          ? [{ url: heroImage, width: 1200, height: 630, alt: name }]
          : [{ url: "/opengraph-image", width: 1200, height: 630, alt: name }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description.slice(0, 160),
        images: heroImage ? [heroImage] : ["/opengraph-image"],
      },
    }
  } catch {
    return { title: "Category", openGraph: { images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } }
  }
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  // Server-render CollectionPage + ItemList + BreadcrumbList JSON-LD so the
  // category's structured data + product list are in the initial HTML for
  // crawlers, independent of the client-rendered grid. Freshness is handled by
  // the catalog-change webhook (revalidatePath("/category/<slug>")).
  let graph: object | null = null
  try {
    const headers = { "x-publishable-api-key": PUB_KEY }
    const next = { revalidate: 300 }
    const catRes = await fetch(
      `${BACKEND_URL}/store/product-categories?handle=${encodeURIComponent(slug)}&fields=id,name,handle,description,metadata`,
      { headers, next }
    )
    const cat = (await catRes.json())?.product_categories?.[0]
    if (cat?.id) {
      const prodRes = await fetch(
        `${BACKEND_URL}/store/products?category_id[]=${encodeURIComponent(cat.id)}&fields=id,handle,title&limit=100`,
        { headers, next }
      )
      const products = ((await prodRes.json())?.products || []) as Array<{
        handle?: string
        title?: string
      }>
      const clean = products
        .filter((p) => p.handle && p.title)
        .map((p) => ({ handle: p.handle as string, title: p.title as string }))
      // Only emit the listing schema when the category actually has products —
      // never an empty ItemList.
      if (clean.length > 0) {
        graph = buildCategoryGraph({
          slug,
          name: cat.name,
          description: cat.metadata?.description || cat.description || undefined,
          products: clean,
        })
      }
    }
  } catch {
    // Schema is best-effort; the page still renders without it.
  }

  return (
    <>
      {graph && <JsonLd data={graph} id="category-schema" />}
      {children}
    </>
  )
}
