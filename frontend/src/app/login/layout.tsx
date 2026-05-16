// Noindex layout for /login — auth surfaces never belong in search results.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign in · VastuCart",
  description: "Sign in to your VastuCart account to manage orders, addresses, and consultations.",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
