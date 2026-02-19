"use client"
import CustomerDashboardShell from "@/components/shell/CustomerDashboardShell"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerDashboardShell>{children}</CustomerDashboardShell>
}
