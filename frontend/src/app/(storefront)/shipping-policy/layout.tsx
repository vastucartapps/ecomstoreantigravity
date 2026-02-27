import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "VastuCart shipping policy — free shipping above ₹499, PAN-India delivery in 3–7 days, COD available. All details on timelines, charges, and tracking.",
  alternates: { canonical: "https://store.vastucart.in/shipping-policy" },
  openGraph: {
    title: "Shipping Policy — VastuCart",
    description:
      "Free shipping above ₹499, PAN-India delivery in 3–7 days, COD available. All details on timelines, charges, and tracking.",
    url: "https://store.vastucart.in/shipping-policy",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Shipping Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shipping Policy — VastuCart",
    description: "Free shipping above ₹499. PAN-India delivery in 3–7 days.",
    images: ["/og-default.png"],
  },
}

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
