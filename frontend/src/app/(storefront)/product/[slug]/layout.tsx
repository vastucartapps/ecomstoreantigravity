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
      `${BACKEND_URL}/store/products?handle=${encodeURIComponent(slug)}&fields=id,title,description,thumbnail,metadata`,
      {
        headers: { "x-publishable-api-key": PUB_KEY },
        next: { revalidate: 3600 },
      }
    )
    const data = await res.json()
    const product = data.products?.[0]

    if (!product) return { title: "Product Not Found" }

    const title = product.title
    const description = product.description
      ? product.description.slice(0, 160)
      : `Buy ${product.title} at VastuCart. Authentic spiritual products delivered across India with free shipping.`
    const imageUrl = product.thumbnail || ""
    const url = `https://store.vastucart.in/product/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "website",
        images: imageUrl
          ? [{ url: imageUrl, width: 800, height: 800, alt: title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return { title: "Product | VastuCart" }
  }
}

export default function ProductLayout({ children }: { children: ReactNode }) {
  return children
}
