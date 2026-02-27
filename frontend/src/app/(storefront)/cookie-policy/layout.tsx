import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "VastuCart's cookie policy — how we use cookies and similar technologies to enhance your browsing experience and improve our services.",
  alternates: { canonical: "https://store.vastucart.in/cookie-policy" },
  openGraph: {
    title: "Cookie Policy — VastuCart",
    description:
      "How VastuCart uses cookies and similar technologies to enhance your browsing experience.",
    url: "https://store.vastucart.in/cookie-policy",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Cookie Policy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy — VastuCart",
    description: "How VastuCart uses cookies to enhance your browsing experience.",
    images: ["/og-default.png"],
  },
}

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
