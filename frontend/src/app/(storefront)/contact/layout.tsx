import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with VastuCart. Reach out for product inquiries, order support, or any questions. Our team responds within 24 hours.",
  alternates: { canonical: "https://store.vastucart.in/contact" },
  openGraph: {
    title: "Contact VastuCart",
    description:
      "Get in touch with VastuCart. Reach out for product inquiries, order support, or any questions. Our team responds within 24 hours.",
    url: "https://store.vastucart.in/contact",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "Contact VastuCart" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact VastuCart",
    description: "Reach out for product inquiries, order support, or any questions. We respond within 24 hours.",
    images: ["/og-default.png"],
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
