import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Disclaimer",
  description:
    `${b.storeName} product disclaimer — our spiritual products are intended for positive energy and cultural purposes. Please read before purchase.`,
  alternates: { canonical: `${b.siteUrl}/disclaimer` },
  openGraph: {
    title: "Disclaimer",
    description:
      `${b.storeName} product disclaimer — our spiritual products are intended for positive energy and cultural purposes.`,
    url: `${b.siteUrl}/disclaimer`,
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} Disclaimer` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclaimer",
    description: "Our spiritual products are intended for positive energy and cultural purposes.",
    images: ["/og-default.png"],
  },
}
}

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children
}
