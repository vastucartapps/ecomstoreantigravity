import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Contact Us",
  description:
    `Get in touch with ${b.storeName}. Reach out for product inquiries, order support, or any questions. Our team responds within 24 hours.`,
  alternates: { canonical: `${b.siteUrl}/contact` },
  openGraph: {
    title: `Contact ${b.storeName}`,
    description:
      `Get in touch with ${b.storeName}. Reach out for product inquiries, order support, or any questions. Our team responds within 24 hours.`,
    url: `${b.siteUrl}/contact`,
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `Contact ${b.storeName}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact ${b.storeName}`,
    description: "Reach out for product inquiries, order support, or any questions. We respond within 24 hours.",
    images: ["/og-default.png"],
  },
}
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
