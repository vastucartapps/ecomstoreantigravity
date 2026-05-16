// Noindex layout for /checkout — transactional surface, must not index.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checkout · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children
}
