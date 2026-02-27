import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Consultation Terms",
  description:
    "VastuCart consultation terms — conditions for booking Vastu Shastra and astrology consultation sessions, cancellations, and rescheduling.",
  alternates: { canonical: "https://store.vastucart.in/consultation-terms" },
  openGraph: {
    title: "Consultation Terms — VastuCart",
    description:
      "Conditions for booking Vastu Shastra and astrology consultations at VastuCart — cancellations, rescheduling, and session guidelines.",
    url: "https://store.vastucart.in/consultation-terms",
    type: "website",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "VastuCart Consultation Terms" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consultation Terms — VastuCart",
    description: "Conditions for booking Vastu and astrology consultations.",
    images: ["/og-default.png"],
  },
}

export default function ConsultationTermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
