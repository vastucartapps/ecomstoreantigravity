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
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: `${b.storeName} Consultation Terms` }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consultation Terms",
    description: "Conditions for booking Vastu and astrology consultations.",
    images: ["/og-default.png"],
  },
}
}

export default function ConsultationTermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
