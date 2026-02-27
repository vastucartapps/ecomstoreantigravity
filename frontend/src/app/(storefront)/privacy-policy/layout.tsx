import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "VastuCart's privacy policy — how we collect, use, and protect your personal information when you shop with us. Your privacy is our priority.",
  alternates: { canonical: "https://store.vastucart.in/privacy-policy" },
  openGraph: {
    title: "Privacy Policy — VastuCart",
    description:
      "VastuCart's privacy policy — how we collect, use, and protect your personal information when you shop with us.",
    url: "https://store.vastucart.in/privacy-policy",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Privacy Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — VastuCart",
    description: "How VastuCart collects, uses, and protects your personal information.",
    images: ["/og-default.png"],
  },
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
