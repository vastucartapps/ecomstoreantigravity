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
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName}` }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
}
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
