import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "My Wishlist",
  description: `Your ${b.storeName} wishlist — saved products you love. Add them to cart when you're ready.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: "My Wishlist",
    description: `Your saved ${b.storeName} products.`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName}` }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
}
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
