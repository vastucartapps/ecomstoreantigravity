import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Intellectual Property Policy",
  description:
    "VastuCart intellectual property policy — protecting our content, trademarks, product imagery, and brand assets.",
  alternates: { canonical: "https://store.vastucart.in/intellectual-property" },
  openGraph: {
    title: "Intellectual Property Policy — VastuCart",
    description: "VastuCart's policy on protecting our content, trademarks, product imagery, and brand assets.",
    url: "https://store.vastucart.in/intellectual-property",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart IP Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intellectual Property Policy — VastuCart",
    description: "Protecting VastuCart content, trademarks, and brand assets.",
    images: ["/og-default.png"],
  },
}

export default function IntellectualPropertyLayout({ children }: { children: React.ReactNode }) {
  return children
}
