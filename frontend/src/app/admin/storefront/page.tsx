"use client"

import { useEffect, useState } from "react"
import { primary, earth, fonts } from "@/lib/theme"
import { AdminStorefront } from "@/components/admin/storefront"
import { useAdminStorefront } from "@/hooks/useAdminStorefront"
import type {
  StorefrontConfig,
  Announcement,
  Branding,
  FooterConfig,
} from "@/types/admin-storefront"

export default function StorefrontPage() {
  const hook = useAdminStorefront()
  const [config, setConfig] = useState<StorefrontConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const c = await hook.fetchConfig()
      setConfig(c)
    } catch (e: any) {
      setError(e.message || "Failed to load storefront settings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px 0",
        }}
      >
        <p style={{ color: earth[400], fontSize: "14px" }}>
          Loading storefront settings…
        </p>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "#EF4444", marginBottom: "16px", fontSize: "14px" }}>
          {error || "Failed to load settings"}
        </p>
        <button
          onClick={load}
          style={{
            padding: "8px 20px",
            background: primary[500],
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            color: primary[900],
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Storefront &amp; Content
        </h1>
        <p style={{ color: earth[400], fontSize: "0.875rem" }}>
          Manage announcement ribbon, branding, homepage sections, content pages, and footer
        </p>
      </div>

      <AdminStorefront
        announcement={config.announcement}
        branding={config.branding}
        homepageSections={config.homepageSections}
        contentPages={config.contentPages}
        footerConfig={config.footerConfig}
        onUpdateAnnouncement={async (a: Announcement) => {
          await hook.updateAnnouncement(a)
          setConfig((prev) => prev ? { ...prev, announcement: a } : prev)
          showToast("Announcement saved")
        }}
        onUpdateBranding={async (b: Branding) => {
          await hook.updateBranding(b)
          setConfig((prev) => prev ? { ...prev, branding: b } : prev)
          showToast("Branding saved")
        }}
        onReorderSection={async (id: string, direction: "up" | "down") => {
          await hook.reorderSection(id, direction)
          // Config state is updated optimistically in the component;
          // reload to sync with server after a short delay
        }}
        onToggleSection={async (id: string, enabled: boolean) => {
          await hook.toggleSection(id, enabled)
          setConfig((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              homepageSections: prev.homepageSections.map((s) =>
                s.id === id ? { ...s, enabled } : s
              ),
            }
          })
        }}
        onEditPage={async (id: string, content: string) => {
          await hook.editPage(id, content)
          setConfig((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              contentPages: prev.contentPages.map((p) =>
                p.id === id
                  ? { ...p, content, lastUpdated: new Date().toISOString() }
                  : p
              ),
            }
          })
          showToast("Page content saved")
        }}
        onTogglePagePublish={async (id: string, published: boolean) => {
          await hook.togglePagePublish(id, published)
          setConfig((prev) => {
            if (!prev) return prev
            return {
              ...prev,
              contentPages: prev.contentPages.map((p) =>
                p.id === id ? { ...p, isPublished: published } : p
              ),
            }
          })
          showToast(published ? "Page published" : "Page set to draft")
        }}
        onUpdateFooter={async (f: FooterConfig) => {
          await hook.updateFooter(f)
          setConfig((prev) => prev ? { ...prev, footerConfig: f } : prev)
          showToast("Footer saved")
        }}
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: toast.type === "success" ? "#10B981" : "#EF4444",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
