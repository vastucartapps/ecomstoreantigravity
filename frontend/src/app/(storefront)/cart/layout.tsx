import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Shopping Cart",
  description: `Your ${b.storeName} shopping cart. Review items, apply coupons, and proceed to checkout.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: "Shopping Cart",
    description: "Review your items and proceed to checkout.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName}` }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
}
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
