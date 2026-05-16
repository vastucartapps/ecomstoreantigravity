import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "About Us",
  description:
    `Learn about ${b.storeName} — India's trusted marketplace for authentic spiritual products, Vastu Shastra tools, crystals, and sacred items. Our mission, story, and values.`,
  alternates: { canonical: `${b.siteUrl}/about` },
  openGraph: {
    title: `About ${b.storeName} — Our Story & Mission`,
    description:
      `Learn about ${b.storeName} — India's trusted marketplace for authentic spiritual products, Vastu Shastra tools, crystals, and sacred items. Our mission, story, and values.`,
    url: `${b.siteUrl}/about`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `About ${b.storeName}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `About ${b.storeName} — Our Story & Mission`,
    description:
      "India's trusted marketplace for authentic spiritual products. Learn our story, mission, and values.",
    images: ["/opengraph-image"],
  },
}
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
