import type { Metadata } from "next"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

export async function generateMetadata(): Promise<Metadata> {
  const b = await fetchBrandingForMetadata()
  return {
  title: "Track Your Order",
  description:
    `Track your ${b.storeName} order in real-time. Enter your order ID or tracking number to see current delivery status and estimated arrival.`,
  robots: { index: false, follow: false },
  openGraph: {
    title: "Track Your Order",
    description: `Track your ${b.storeName} order in real-time. Enter your order ID to see delivery status.`,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Track Order" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Track Your Order",
    description: `Track your ${b.storeName} order in real-time.`,
    images: ["/opengraph-image"],
  },
}
}

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children
}
