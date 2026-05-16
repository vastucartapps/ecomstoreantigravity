import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"
import type { ReactNode } from "react"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Search Products",
  description:
    `Search thousands of authentic spiritual products at ${b.storeName} — crystals, yantras, incense, and more. Free shipping across India.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: `Search Products | ${b.storeName}`,
    description: `Search authentic spiritual products at ${b.storeName}.`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName}` }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
}
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children
}
