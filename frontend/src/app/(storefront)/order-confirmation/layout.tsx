// Noindex layout for /order-confirmation/* — transactional pages with PII
// (order ID, address, items) that must never appear in search results.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Order confirmation · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function OrderConfirmationLayout({ children }: { children: React.ReactNode }) {
  return children
}
