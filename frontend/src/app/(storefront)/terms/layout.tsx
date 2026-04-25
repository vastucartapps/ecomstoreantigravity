import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Terms & Conditions",
  description:
    `${b.storeName}'s terms and conditions — understand your rights and responsibilities when using our platform and purchasing our products.`,
  alternates: { canonical: `${b.siteUrl}/terms` },
  openGraph: {
    title: "Terms & Conditions",
    description:
      `${b.storeName}'s terms and conditions — understand your rights and responsibilities when using our platform and purchasing our products.`,
    url: `${b.siteUrl}/terms`,
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} Terms & Conditions` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions",
    description: `Your rights and responsibilities when using ${b.storeName}.`,
    images: ["/og-default.png"],
  },
}
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
