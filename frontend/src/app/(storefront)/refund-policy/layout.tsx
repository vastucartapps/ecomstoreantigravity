import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

/**
 * SEO metadata is fully dynamic — return-window and brand are sourced
 * from admin so a single edit (Shipping → Return Policy → Window Days,
 * or Storefront → Branding → Store Name) updates the SERP description
 * within ~5 minutes.
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  const title = "Refund & Return Policy"
  const desc = `${b.storeName}'s refund and return policy — hassle-free returns within ${b.returnWindowDays} days of delivery. Know your rights and how to initiate a return.`
  const shortDesc = `Hassle-free returns within ${b.returnWindowDays} days. Know your rights before you buy.`

  return {
    title,
    description: desc,
    alternates: { canonical: `${b.siteUrl}/refund-policy` },
    openGraph: {
      title,
      description: `Hassle-free returns within ${b.returnWindowDays} days of delivery. Know your rights and how to initiate a return at ${b.storeName}.`,
      url: `${b.siteUrl}/refund-policy`,
      type: "website",
      images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} Refund Policy` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: shortDesc,
      images: ["/og-default.png"],
    },
  }
}

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
