import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

/**
 * SEO metadata is fully dynamic — free-shipping threshold and brand
 * name are sourced from admin so a single edit (Shipping → Free Shipping,
 * or Storefront → Branding) updates the SERP description within ~5 min.
 */
export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  const title = "Shipping Policy"
  const threshold = `₹${b.freeShippingInr.toLocaleString("en-IN")}`
  const desc = `${b.storeName} shipping policy — free shipping above ${threshold}, PAN-India delivery in 3–7 days, COD available. All details on timelines, charges, and tracking.`
  const ogDesc = `Free shipping above ${threshold}, PAN-India delivery in 3–7 days, COD available. All details on timelines, charges, and tracking.`
  const shortDesc = `Free shipping above ${threshold}. PAN-India delivery in 3–7 days.`

  return {
    title,
    description: desc,
    alternates: { canonical: `${b.siteUrl}/shipping-policy` },
    openGraph: {
      title,
      description: ogDesc,
      url: `${b.siteUrl}/shipping-policy`,
      type: "website",
      images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} Shipping Policy` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: shortDesc,
      images: ["/og-default.png"],
    },
  }
}

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
