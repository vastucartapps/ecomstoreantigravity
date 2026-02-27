import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description:
    "Frequently asked questions about VastuCart — shipping timelines, returns, product authenticity, payment methods, and order tracking. Get answers fast.",
  alternates: { canonical: "https://store.vastucart.in/faq" },
  openGraph: {
    title: "FAQ — VastuCart",
    description:
      "Frequently asked questions about VastuCart — shipping timelines, returns, product authenticity, payment methods, and order tracking. Get answers fast.",
    url: "https://store.vastucart.in/faq",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart FAQ" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — VastuCart",
    description: "Answers to common questions about shipping, returns, product authenticity, and payments.",
    images: ["/og-default.png"],
  },
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
