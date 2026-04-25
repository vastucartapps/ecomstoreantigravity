import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "FAQ — Frequently Asked Questions",
  description:
    `Frequently asked questions about ${b.storeName} — shipping timelines, returns, product authenticity, payment methods, and order tracking. Get answers fast.`,
  alternates: { canonical: `${b.siteUrl}/faq` },
  openGraph: {
    title: "FAQ",
    description:
      `Frequently asked questions about ${b.storeName} — shipping timelines, returns, product authenticity, payment methods, and order tracking. Get answers fast.`,
    url: `${b.siteUrl}/faq`,
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} FAQ` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ",
    description: "Answers to common questions about shipping, returns, product authenticity, and payments.",
    images: ["/og-default.png"],
  },
}
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
