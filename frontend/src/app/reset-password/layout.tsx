// Noindex layout for /reset-password — token-bearing URL must never index.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Set a new password · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
