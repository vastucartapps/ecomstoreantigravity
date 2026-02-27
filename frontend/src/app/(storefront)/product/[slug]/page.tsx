import type { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Convert a raw MinIO/S3 image URL to an absolute HTTPS URL suitable for OG tags.
 * Client-side we use the /api/img-proxy relative path, but social crawlers need
 * a fully-qualified URL.
 */
function toAbsoluteOgImage(url: string | undefined | null): string {
  if (!url) return ""
  const match = url.match(/\/medusa-uploads\/(.+)$/)
  if (match) return `${SITE_URL}/api/img-proxy/${match[1]}`
  if (url.startsWith("http")) return url
  return `${SITE_URL}${url}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await fetch(
      `${BACKEND_URL}/store/products?handle=${slug}&fields=id,title,description,thumbnail,images.id,images.url,metadata`,
      {
        headers: { "x-publishable-api-key": PUB_KEY },
        next: { revalidate: 3600 },
      }
    )
    const data = await res.json()
    const p = data.products?.[0]
    if (!p) return { title: "Product Not Found | VastuCart" }

    const title = `${p.title} | VastuCart`
    const description =
      p.description ||
      p.metadata?.seo_description ||
      `Buy ${p.title} online at VastuCart — India's trusted Vastu & wellness store.`
    const rawImage = p.thumbnail || p.images?.[0]?.url || ""
    const imageUrl = toAbsoluteOgImage(rawImage)
    const pageUrl = `${SITE_URL}/product/${slug}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: pageUrl,
        type: "website",
        siteName: "VastuCart",
        ...(imageUrl
          ? {
              images: [
                {
                  url: imageUrl,
                  width: 1200,
                  height: 630,
                  alt: p.title,
                },
              ],
            }
          : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    }
  } catch {
    return { title: "Product | VastuCart" }
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // params consumed by generateMetadata above; client component reads slug via useParams()
  await params
  return <ProductPageClient />
}
