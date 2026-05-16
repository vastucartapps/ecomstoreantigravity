import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Consultation Terms",
  description:
    `${b.storeName} consultation terms — conditions for booking Vastu Shastra and astrology consultation sessions, cancellations, and rescheduling.`,
  alternates: { canonical: `${b.siteUrl}/consultation-terms` },
  openGraph: {
    title: "Consultation Terms",
    description:
      `Conditions for booking Vastu Shastra and astrology consultations at ${b.storeName} — cancellations, rescheduling, and session guidelines.`,
    url: `${b.siteUrl}/consultation-terms`,
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: `${b.storeName} Consultation Terms` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consultation Terms",
    description: "Conditions for booking Vastu and astrology consultations.",
    images: ["/opengraph-image"],
  },
}
}

export default function ConsultationTermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
