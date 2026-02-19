"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminEcosystemAds } from "@/components/admin/ecosystem-ads"
import { useAdminEcosystemAds } from "@/hooks/useAdminEcosystemAds"
import { primary, earth, fonts, bg, semantic } from "@/lib/theme"
import { X, CheckCircle, AlertTriangle } from "lucide-react"
import type {
  AdTab,
  Banner,
  BannerFormData,
  EcosystemSite,
  BannerAnalytics,
  AnalyticsSummary,
  SocialAccount,
  SocialPost,
  SocialPostMeta,
  SocialPlatform,
  SocialPlatformConfig,
  AspectRatio,
} from "@/types/admin-ecosystem-ads"

interface Toast {
  message: string
  type: "success" | "error"
}

export default function AdminEcosystemAdsPage() {
  const hook = useAdminEcosystemAds()

  const [activeTab, setActiveTab] = useState<AdTab>("banners")
  const [banners, setBanners] = useState<Banner[]>([])
  const [sites, setSites] = useState<EcosystemSite[]>([])
  const [analytics, setAnalytics] = useState<BannerAnalytics[]>([])
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({
    totalImpressions: 0,
    totalClicks: 0,
    avgCtr: 0,
    activeBanners: 0,
  })
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Load initial data
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [b, s, a, acc, p] = await Promise.all([
          hook.fetchBanners(),
          hook.fetchSites(),
          hook.fetchAnalytics(),
          hook.fetchSocialAccounts(),
          hook.fetchSocialPosts(),
        ])
        setBanners(b)
        setSites(s)
        setAnalytics(a.analytics)
        setAnalyticsSummary(a.summary)
        setSocialAccounts(acc)
        setSocialPosts(p)
      } catch (err: any) {
        showToast(err.message || "Failed to load data", "error")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Handlers ──────────────────────────────────────────────────────

  const handleCreateBanner = async (data: BannerFormData) => {
    try {
      await hook.createBanner(data)
      setBanners(await hook.fetchBanners())
      showToast("Banner created")
    } catch (err: any) {
      showToast(err.message || "Failed to create banner", "error")
      throw err
    }
  }

  const handleEditBanner = async (id: string, data: Partial<BannerFormData>) => {
    try {
      await hook.updateBanner(id, data)
      setBanners(await hook.fetchBanners())
      showToast("Banner updated")
    } catch (err: any) {
      showToast(err.message || "Failed to update banner", "error")
      throw err
    }
  }

  const handleDeleteBanner = async (id: string) => {
    try {
      await hook.deleteBanner(id)
      setBanners(await hook.fetchBanners())
      setSites(await hook.fetchSites())
      showToast("Banner deleted")
    } catch (err: any) {
      showToast(err.message || "Failed to delete banner", "error")
      throw err
    }
  }

  const handleToggleBanner = async (id: string) => {
    try {
      await hook.toggleBanner(id)
      setBanners(await hook.fetchBanners())
    } catch (err: any) {
      showToast(err.message || "Failed to toggle banner", "error")
    }
  }

  const handleCreateSite = async (subdomain: string, displayName: string) => {
    try {
      await hook.createSite(subdomain, displayName)
      setSites(await hook.fetchSites())
      showToast("Site added")
    } catch (err: any) {
      showToast(err.message || "Failed to create site", "error")
      throw err
    }
  }

  const handleDeleteSite = async (id: string) => {
    try {
      await hook.deleteSite(id)
      setSites(await hook.fetchSites())
      showToast("Site deleted")
    } catch (err: any) {
      showToast(err.message || "Failed to delete site", "error")
      throw err
    }
  }

  const handleToggleSite = async (id: string) => {
    try {
      await hook.toggleSite(id)
      setSites(await hook.fetchSites())
    } catch (err: any) {
      showToast(err.message || "Failed to toggle site", "error")
    }
  }

  const handleCreateSlot = async (siteId: string, name: string, ratio: AspectRatio) => {
    try {
      await hook.createSlot(siteId, name, ratio)
      setSites(await hook.fetchSites())
      showToast("Slot added")
    } catch (err: any) {
      showToast(err.message || "Failed to create slot", "error")
      throw err
    }
  }

  const handleAssignPlacement = async (slotId: string, bannerId: string) => {
    try {
      await hook.assignSlot(slotId, bannerId)
      setSites(await hook.fetchSites())
      showToast("Banner assigned to slot")
    } catch (err: any) {
      showToast(err.message || "Failed to assign banner", "error")
    }
  }

  const handleRemovePlacement = async (slotId: string) => {
    try {
      await hook.removeSlotAssignment(slotId)
      setSites(await hook.fetchSites())
      showToast("Banner removed from slot")
    } catch (err: any) {
      showToast(err.message || "Failed to remove assignment", "error")
    }
  }

  const handleSaveSocialConfig = async (platform: SocialPlatform, config: SocialPlatformConfig) => {
    try {
      await hook.saveSocialConfig(platform, config)
      setSocialAccounts(await hook.fetchSocialAccounts())
      const isDisconnect = !config.access_token
      showToast(isDisconnect ? `${platform} disconnected` : `${platform} connected`)
    } catch (err: any) {
      showToast(err.message || "Failed to save config", "error")
      throw err
    }
  }

  const handlePublishToSocial = async (
    bannerId: string,
    platform: SocialPlatform,
    caption: string,
    meta: SocialPostMeta
  ) => {
    try {
      const result = await hook.publishToSocial(bannerId, platform, caption, meta)
      setSocialPosts(await hook.fetchSocialPosts())
      if (result.status === "published") {
        showToast(`Published to ${platform}`)
      } else {
        showToast(result.error || `Publish to ${platform} failed`, "error")
      }
    } catch (err: any) {
      showToast(err.message || "Failed to publish", "error")
      throw err
    }
  }

  const handleFetchAnalytics = async (period?: string) => {
    try {
      const data = await hook.fetchAnalytics(period)
      setAnalytics(data.analytics)
      setAnalyticsSummary(data.summary)
    } catch (err: any) {
      showToast(err.message || "Failed to fetch analytics", "error")
    }
  }

  return (
    <div className="relative">
      <AdminEcosystemAds
        activeTab={activeTab}
        banners={banners}
        sites={sites}
        analytics={analytics}
        analyticsSummary={analyticsSummary}
        socialAccounts={socialAccounts}
        socialPosts={socialPosts}
        isLoading={isLoading}
        onChangeTab={setActiveTab}
        onCreateBanner={handleCreateBanner}
        onEditBanner={handleEditBanner}
        onDeleteBanner={handleDeleteBanner}
        onToggleBanner={handleToggleBanner}
        onCreateSite={handleCreateSite}
        onDeleteSite={handleDeleteSite}
        onToggleSite={handleToggleSite}
        onCreateSlot={handleCreateSlot}
        onAssignPlacement={handleAssignPlacement}
        onRemovePlacement={handleRemovePlacement}
        onSaveSocialConfig={handleSaveSocialConfig}
        onPublishToSocial={handlePublishToSocial}
        onFetchAnalytics={handleFetchAnalytics}
        onUploadFile={hook.uploadFile}
        onSearchProducts={hook.searchProducts}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            backgroundColor: toast.type === "success" ? semantic.successLight : semantic.errorLight,
            color: toast.type === "success" ? semantic.success : semantic.error,
            fontFamily: fonts.body,
          }}
        >
          {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="flex-shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
