// Noindex layout for /forgot-password.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset your password · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
