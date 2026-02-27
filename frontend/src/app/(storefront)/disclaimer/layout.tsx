import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "VastuCart product disclaimer — our spiritual products are intended for positive energy and cultural purposes. Please read before purchase.",
  alternates: { canonical: "https://store.vastucart.in/disclaimer" },
  openGraph: {
    title: "Disclaimer — VastuCart",
    description:
      "VastuCart product disclaimer — our spiritual products are intended for positive energy and cultural purposes.",
    url: "https://store.vastucart.in/disclaimer",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Disclaimer" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclaimer — VastuCart",
    description: "Our spiritual products are intended for positive energy and cultural purposes.",
    images: ["/og-default.png"],
  },
}

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children
}
