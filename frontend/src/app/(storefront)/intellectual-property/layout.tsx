import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Intellectual Property Policy",
  description:
    `${b.storeName} intellectual property policy — protecting our content, trademarks, product imagery, and brand assets.`,
  alternates: { canonical: `${b.siteUrl}/intellectual-property` },
  openGraph: {
    title: "Intellectual Property Policy",
    description: `${b.storeName}'s policy on protecting our content, trademarks, product imagery, and brand assets.`,
    url: `${b.siteUrl}/intellectual-property`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} IP Policy` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellectual Property Policy",
    description: `Protecting ${b.storeName} content, trademarks, and brand assets.`,
    images: ["/opengraph-image"],
  },
}
}

export default function IntellectualPropertyLayout({ children }: { children: React.ReactNode }) {
  return children
}
