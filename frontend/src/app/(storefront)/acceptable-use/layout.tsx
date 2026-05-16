import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Acceptable Use Policy",
  description:
    `${b.storeName} acceptable use policy — guidelines for using our platform and services responsibly and lawfully.`,
  alternates: { canonical: `${b.siteUrl}/acceptable-use` },
  openGraph: {
    title: "Acceptable Use Policy",
    description: `Guidelines for using ${b.storeName}'s platform and services responsibly and lawfully.`,
    url: `${b.siteUrl}/acceptable-use`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} Acceptable Use Policy` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Acceptable Use Policy",
    description: `Guidelines for using ${b.storeName} responsibly.`,
    images: ["/opengraph-image"],
  },
}
}

export default function AcceptableUseLayout({ children }: { children: React.ReactNode }) {
  return children
}
