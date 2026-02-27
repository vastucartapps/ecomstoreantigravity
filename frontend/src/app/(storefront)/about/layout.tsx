import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about VastuCart — India's trusted marketplace for authentic spiritual products, Vastu Shastra tools, crystals, and sacred items. Our mission, story, and values.",
  alternates: { canonical: "https://store.vastucart.in/about" },
  openGraph: {
    title: "About VastuCart — Our Story & Mission",
    description:
      "Learn about VastuCart — India's trusted marketplace for authentic spiritual products, Vastu Shastra tools, crystals, and sacred items. Our mission, story, and values.",
    url: "https://store.vastucart.in/about",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "About VastuCart" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About VastuCart — Our Story & Mission",
    description:
      "India's trusted marketplace for authentic spiritual products. Learn our story, mission, and values.",
    images: ["/og-default.png"],
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
