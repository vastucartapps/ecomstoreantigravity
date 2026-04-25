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
  HeroSlide,
  MarketingSlide,
  AboutConfig,
  ContactConfig,
  ConsultationConfig,
} from "@/types/admin-storefront"

export default function StorefrontPage() {
  const hook = useAdminStorefront()
  const [config, setConfig] = useState<StorefrontConfig | null>(null)
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([])
  const [marketingSlides, setMarketingSlides] = useState<MarketingSlide[]>([])
  const [aboutConfig, setAboutConfig] = useState<AboutConfig | null>(null)
  const [contactConfig, setContactConfig] = useState<ContactConfig | null>(null)
  const [consultationConfig, setConsultationConfig] = useState<ConsultationConfig | null>(null)
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
      const [c, hs, ms, ac, cc, conc] = await Promise.all([
        hook.fetchConfig(),
        hook.fetchHeroSlides(),
        hook.fetchMarketingSlides(),
        hook.fetchAboutConfig(),
        hook.fetchContactConfig(),
        hook.fetchConsultationConfig(),
      ])
      setConfig(c)
      setHeroSlides(hs)
      setMarketingSlides(ms)
      setAboutConfig(ac)
      setContactConfig(cc)
      setConsultationConfig(conc)
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

  if (error || !config || !aboutConfig || !contactConfig || !consultationConfig) {
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
        clusterSites={config.clusterSites}
        heroSlides={heroSlides}
        marketingSlides={marketingSlides}
        aboutConfig={aboutConfig}
        contactConfig={contactConfig}
        consultationConfig={consultationConfig}
        onUpdateAnnouncement={async (a: Announcement) => {
          try {
            await hook.updateAnnouncement(a)
            setConfig((prev) => prev ? { ...prev, announcement: a } : prev)
            showToast("Announcement saved")
          } catch {
            showToast("Failed to save announcement", "error")
          }
        }}
        onUpdateBranding={async (b: Branding) => {
          try {
            await hook.updateBranding(b)
            setConfig((prev) => prev ? { ...prev, branding: b } : prev)
            showToast("Branding saved")
          } catch {
            showToast("Failed to save branding", "error")
          }
        }}
        onReorderSection={async (id: string, direction: "up" | "down") => {
          try {
            await hook.reorderSection(id, direction)
          } catch {
            showToast("Failed to reorder section", "error")
          }
        }}
        onToggleSection={async (id: string, enabled: boolean) => {
          try {
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
          } catch {
            showToast("Failed to update section", "error")
          }
        }}
        onEditPage={async (id: string, content: string) => {
          try {
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
          } catch {
            showToast("Failed to save page content", "error")
          }
        }}
        onTogglePagePublish={async (id: string, published: boolean) => {
          try {
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
          } catch {
            showToast("Failed to update page status", "error")
          }
        }}
        onUpdateFooter={async (f: FooterConfig) => {
          try {
            await hook.updateFooter(f)
            setConfig((prev) => prev ? { ...prev, footerConfig: f } : prev)
            showToast("Footer saved")
          } catch {
            showToast("Failed to save footer", "error")
          }
        }}
        onUpdateClusterSites={async (sites) => {
          try {
            await hook.updateClusterSites(sites)
            setConfig((prev) => prev ? { ...prev, clusterSites: sites } : prev)
            showToast("Cluster sites saved")
          } catch {
            showToast("Failed to save cluster sites", "error")
          }
        }}
        onCreateHeroSlide={async (data) => {
          try {
            const slide = await hook.createHeroSlide(data)
            setHeroSlides((prev) => [...prev, slide].sort((a, b) => a.display_order - b.display_order))
            showToast("Hero slide added")
          } catch {
            showToast("Failed to add hero slide", "error")
          }
        }}
        onUpdateHeroSlide={async (id, data) => {
          try {
            const slide = await hook.updateHeroSlide(id, data)
            setHeroSlides((prev) => prev.map((s) => s.id === id ? slide : s))
            showToast("Hero slide saved")
            return slide
          } catch {
            showToast("Failed to save hero slide", "error")
            throw new Error("Failed")
          }
        }}
        onDeleteHeroSlide={async (id) => {
          try {
            await hook.deleteHeroSlide(id)
            setHeroSlides((prev) => prev.filter((s) => s.id !== id))
            showToast("Hero slide deleted")
          } catch {
            showToast("Failed to delete hero slide", "error")
          }
        }}
        onCreateMarketingSlide={async (data) => {
          try {
            const slide = await hook.createMarketingSlide(data)
            setMarketingSlides((prev) => [...prev, slide].sort((a, b) => a.display_order - b.display_order))
            showToast("Login slide added")
          } catch {
            showToast("Failed to add login slide", "error")
          }
        }}
        onUpdateMarketingSlide={async (id, data) => {
          try {
            const slide = await hook.updateMarketingSlide(id, data)
            setMarketingSlides((prev) => prev.map((s) => s.id === id ? slide : s))
            showToast("Login slide saved")
            return slide
          } catch {
            showToast("Failed to save login slide", "error")
            throw new Error("Failed")
          }
        }}
        onDeleteMarketingSlide={async (id) => {
          try {
            await hook.deleteMarketingSlide(id)
            setMarketingSlides((prev) => prev.filter((s) => s.id !== id))
            showToast("Login slide deleted")
          } catch {
            showToast("Failed to delete login slide", "error")
          }
        }}
        onSaveAboutConfig={async (c: AboutConfig) => {
          try {
            await hook.saveAboutConfig(c)
            setAboutConfig(c)
            showToast("About page saved")
          } catch {
            showToast("Failed to save about page", "error")
          }
        }}
        onSaveContactConfig={async (c: ContactConfig) => {
          try {
            await hook.saveContactConfig(c)
            setContactConfig(c)
            showToast("Contact page saved")
          } catch {
            showToast("Failed to save contact page", "error")
          }
        }}
        onSaveConsultationConfig={async (c: ConsultationConfig) => {
          try {
            await hook.saveConsultationConfig(c)
            setConsultationConfig(c)
            showToast("Consultation settings saved")
          } catch {
            showToast("Failed to save consultation settings", "error")
          }
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
