import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Your VastuCart shopping cart. Review items, apply coupons, and proceed to checkout.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Shopping Cart — VastuCart",
    description: "Review your items and proceed to checkout.",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children
}
