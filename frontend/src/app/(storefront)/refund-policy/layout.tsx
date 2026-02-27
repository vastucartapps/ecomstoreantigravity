import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Refund & Return Policy",
  description:
    "VastuCart's refund and return policy — hassle-free returns within 7 days of delivery. Know your rights and how to initiate a return.",
  alternates: { canonical: "https://store.vastucart.in/refund-policy" },
  openGraph: {
    title: "Refund & Return Policy — VastuCart",
    description:
      "Hassle-free returns within 7 days of delivery. Know your rights and how to initiate a return at VastuCart.",
    url: "https://store.vastucart.in/refund-policy",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Refund Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Refund & Return Policy — VastuCart",
    description: "Hassle-free returns within 7 days. Know your rights before you buy.",
    images: ["/og-default.png"],
  },
}

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
