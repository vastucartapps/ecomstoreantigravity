import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gift Cards — VastuCart",
  description:
    "Give the gift of wellness and spirituality. Buy VastuCart gift cards in INR or USD — instantly delivered, valid for 1 year, redeemable on all products.",
  openGraph: {
    title: "VastuCart Gift Cards",
    description:
      "Give the gift of wellness and spirituality. Buy VastuCart gift cards — valid for 1 year, redeemable on all products.",
    type: "website",
  },
}

export default function GiftCardsLayout({ children }: { children: React.ReactNode }) {
  return children
}
