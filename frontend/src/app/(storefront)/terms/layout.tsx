import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "VastuCart's terms and conditions — understand your rights and responsibilities when using our platform and purchasing our products.",
  alternates: { canonical: "https://store.vastucart.in/terms" },
  openGraph: {
    title: "Terms & Conditions — VastuCart",
    description:
      "VastuCart's terms and conditions — understand your rights and responsibilities when using our platform and purchasing our products.",
    url: "https://store.vastucart.in/terms",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Terms & Conditions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Conditions — VastuCart",
    description: "Your rights and responsibilities when using VastuCart.",
    images: ["/og-default.png"],
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
