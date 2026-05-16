import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Cookie Policy",
  description:
    `${b.storeName}'s cookie policy — how we use cookies and similar technologies to enhance your browsing experience and improve our services.`,
  alternates: { canonical: `${b.siteUrl}/cookie-policy` },
  openGraph: {
    title: "Cookie Policy",
    description:
      `How ${b.storeName} uses cookies and similar technologies to enhance your browsing experience.`,
    url: `${b.siteUrl}/cookie-policy`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} Cookie Policy` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy",
    description: `How ${b.storeName} uses cookies to enhance your browsing experience.`,
    images: ["/opengraph-image"],
  },
}
}

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
