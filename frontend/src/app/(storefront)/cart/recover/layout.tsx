// Noindex layout for /cart/recover/[token] — token-bearing recovery URL,
// must not enter the search index under any circumstance.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Recover your cart · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function CartRecoverLayout({ children }: { children: React.ReactNode }) {
  return children
}
