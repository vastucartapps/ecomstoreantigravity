// Server-component layout — exports metadata so `/admin/*` (and every page
// nested below) is set noindex. The interactive shell stays in AdminShell
// (a "use client" component).
import AdminShell from "@/components/shell/AdminShell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
