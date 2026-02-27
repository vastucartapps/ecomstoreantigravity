import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Track Your Order",
  description:
    "Track your VastuCart order in real-time. Enter your order ID or tracking number to see current delivery status and estimated arrival.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Track Your Order — VastuCart",
    description: "Track your VastuCart order in real-time. Enter your order ID to see delivery status.",
    images: [{ url: "/og-default.png", width: 500, height: 500, alt: "Track Order — VastuCart" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Order — VastuCart",
    description: "Track your VastuCart order in real-time.",
    images: ["/og-default.png"],
  },
}

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children
}
