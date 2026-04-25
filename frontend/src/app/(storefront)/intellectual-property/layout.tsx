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
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} IP Policy` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellectual Property Policy",
    description: `Protecting ${b.storeName} content, trademarks, and brand assets.`,
    images: ["/og-default.png"],
  },
}
}

export default function IntellectualPropertyLayout({ children }: { children: React.ReactNode }) {
  return children
}
