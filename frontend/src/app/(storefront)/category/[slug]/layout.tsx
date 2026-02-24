import type { Metadata } from "next"
import type { ReactNode } from "react"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

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

    if (!category) return { title: "Category | VastuCart" }

    const name = category.name
    const title = `${name} — Authentic Spiritual Products`
    const description =
      category.metadata?.description ||
      category.description ||
      `Shop authentic ${name} at VastuCart. Premium quality spiritual products delivered across India.`
    const heroImage = category.metadata?.hero_image || category.metadata?.image_url || ""
    const url = `https://store.vastucart.in/category/${slug}`

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
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: description.slice(0, 160),
        images: heroImage ? [heroImage] : [],
      },
    }
  } catch {
    return { title: "Category | VastuCart" }
  }
}

export default function CategoryLayout({ children }: { children: ReactNode }) {
  return children
}
