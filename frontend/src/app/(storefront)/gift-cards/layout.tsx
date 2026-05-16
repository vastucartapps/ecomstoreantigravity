import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Gift Cards",
  description:
    `Give the gift of wellness and spirituality. Buy ${b.storeName} gift cards in INR or USD — instantly delivered, valid for 1 year, redeemable on all products.`,
  alternates: { canonical: `${b.siteUrl}/gift-cards` },
  openGraph: {
    title: `${b.storeName} Gift Cards`,
    description:
      `Give the gift of wellness and spirituality. Buy ${b.storeName} gift cards — valid for 1 year, redeemable on all products.`,
    url: `${b.siteUrl}/gift-cards`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} Gift Cards` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${b.storeName} Gift Cards`,
    description: `Give the gift of wellness and spirituality. Buy ${b.storeName} gift cards — valid for 1 year.`,
    images: ["/opengraph-image"],
  },
}
}

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
