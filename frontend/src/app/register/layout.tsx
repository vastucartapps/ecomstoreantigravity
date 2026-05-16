// Noindex layout for /register — auth surfaces never belong in search results.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create account · VastuCart",
  description: "Create a VastuCart account to track orders, save addresses, and book consultations.",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
