import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gift Cards — VastuCart",
  description:
    "Give the gift of wellness and spirituality. Buy VastuCart gift cards in INR or USD — instantly delivered, valid for 1 year, redeemable on all products.",
  alternates: { canonical: "https://store.vastucart.in/gift-cards" },
  openGraph: {
    title: "VastuCart Gift Cards",
    description:
      "Give the gift of wellness and spirituality. Buy VastuCart gift cards — valid for 1 year, redeemable on all products.",
    url: "https://store.vastucart.in/gift-cards",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Gift Cards" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VastuCart Gift Cards",
    description: "Give the gift of wellness and spirituality. Buy VastuCart gift cards — valid for 1 year.",
    images: ["/og-default.png"],
  },
}

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
