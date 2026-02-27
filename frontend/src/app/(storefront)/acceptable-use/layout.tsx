import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "VastuCart acceptable use policy — guidelines for using our platform and services responsibly and lawfully.",
  alternates: { canonical: "https://store.vastucart.in/acceptable-use" },
  openGraph: {
    title: "Acceptable Use Policy — VastuCart",
    description: "Guidelines for using VastuCart's platform and services responsibly and lawfully.",
    url: "https://store.vastucart.in/acceptable-use",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Acceptable Use Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Acceptable Use Policy — VastuCart",
    description: "Guidelines for using VastuCart responsibly.",
    images: ["/og-default.png"],
  },
}

export default function AcceptableUseLayout({ children }: { children: React.ReactNode }) {
  return children
}
