import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search thousands of authentic spiritual products at VastuCart — crystals, yantras, incense, and more. Free shipping across India.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Search Products | VastuCart",
    description: "Search authentic spiritual products at VastuCart.",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children
}
