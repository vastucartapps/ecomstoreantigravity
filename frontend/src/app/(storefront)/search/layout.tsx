import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Search Products",
  description:
    "Search thousands of authentic spiritual products at VastuCart — crystals, yantras, incense, and more. Free shipping across India.",
  robots: { index: false, follow: false },
}

export default function SearchLayout({ children }: { children: ReactNode }) {
  return children
}
