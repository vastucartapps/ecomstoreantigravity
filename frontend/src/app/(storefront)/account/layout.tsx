// Server-component layout — exports noindex metadata for all /account/*
// pages (orders, addresses, profile, wishlist, etc.). Customer-private
// surfaces must never enter the search index. The interactive shell stays
// in CustomerDashboardShell ("use client").
import CustomerDashboardShell from "@/components/shell/CustomerDashboardShell"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Account · VastuCart",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerDashboardShell>{children}</CustomerDashboardShell>
}
