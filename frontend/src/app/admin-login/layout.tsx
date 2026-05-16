// Noindex layout for /admin-login — staff-only surface.
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin sign in · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
