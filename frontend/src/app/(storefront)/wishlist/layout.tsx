import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "Your VastuCart wishlist — saved products you love. Add them to cart when you're ready.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "My Wishlist — VastuCart",
    description: "Your saved VastuCart products.",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
}

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return children
}
