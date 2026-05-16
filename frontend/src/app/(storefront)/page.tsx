import type { Metadata } from "next"
import HomePageClient from "@/components/storefront/HomePageClient"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

/**
 * Homepage metadata. Pulls storeName + tagline live from admin so a rename
 * propagates to the SERP title and OG card without a rebuild. Falls back to
 * BRAND_DEFAULTS when the backend is unreachable, so a degraded backend
 * never produces a broken or "undefined" homepage title.
 *
 * We intentionally override the route-level title here (the root layout
 * applies the template `%s | {storeName}` to every other page). The
 * homepage gets the brand's hero treatment instead of "Home | VastuCart".
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  const title = `${b.storeName} — ${b.tagline}`
  const description = `Shop ${b.storeName}: authentic Vastu, spiritual & wellness products with ${b.returnWindowDays}-day returns and free India delivery on orders over ₹${b.freeShippingInr}.`
  const canonical = b.siteUrl

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: b.storeName,
      type: "website",
      locale: "en_IN",
      images: [
        { url: "/opengraph-image", width: 1200, height: 630, alt: title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  }
}

export default function HomePage() {
  return <HomePageClient />
}
