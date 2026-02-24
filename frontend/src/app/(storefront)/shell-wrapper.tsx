"use client"
import StorefrontShell from "@/components/shell/StorefrontShell"
import { InAppAnnouncementsProvider } from "@/providers/inapp-announcements-provider"

export function StorefrontShellWrapper({
  children,
  categories,
}: {
  children: React.ReactNode
  categories: { name: string; handle: string; image_url?: string }[]
}) {
  return (
    <InAppAnnouncementsProvider>
      <StorefrontShell categories={categories}>{children}</StorefrontShell>
    </InAppAnnouncementsProvider>
  )
}
