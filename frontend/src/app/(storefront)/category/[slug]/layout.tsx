import type { Metadata } from "next"
import type { ReactNode } from "react"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

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

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return children
}
