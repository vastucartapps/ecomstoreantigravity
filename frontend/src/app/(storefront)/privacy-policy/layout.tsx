import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Privacy Policy",
  description:
    `${b.storeName}'s privacy policy — how we collect, use, and protect your personal information when you shop with us. Your privacy is our priority.`,
  alternates: { canonical: `${b.siteUrl}/privacy-policy` },
  openGraph: {
    title: "Privacy Policy",
    description:
      `${b.storeName}'s privacy policy — how we collect, use, and protect your personal information when you shop with us.`,
    url: `${b.siteUrl}/privacy-policy`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} Privacy Policy` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy",
    description: `How ${b.storeName} collects, uses, and protects your personal information.`,
    images: ["/opengraph-image"],
  },
}
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
