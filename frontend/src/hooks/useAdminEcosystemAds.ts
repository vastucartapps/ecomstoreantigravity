"use client"

import { useCallback } from "react"
import Medusa from "@medusajs/js-sdk"
import type {
  Banner,
  BannerFormData,
  EcosystemSite,
  BannerAnalytics,
  AnalyticsSummary,
  SocialAccount,
  SocialPost,
  SocialPlatformConfig,
  SocialConfig,
  SocialPostMeta,
  AspectRatio,
  SocialPlatform,
} from "@/types/admin-ecosystem-ads"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUB_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const medusa = new Medusa({
  baseUrl: BACKEND_URL,
  auth: { type: "session" },
})

function getAdminToken(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(/(?:^|;\s*)medusa_admin_jwt=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ""
}

async function adminFetch(path: string, options?: { method?: string; body?: any }) {
  return (medusa.client.fetch as Function)(path, {
    method: options?.method || "GET",
    body: options?.body,
  })
}

export function useAdminEcosystemAds() {
  // ─── Banners ─────────────────────────────────────────────────────────

  const fetchBanners = useCallback(async (): Promise<Banner[]> => {
    const data = await adminFetch("/admin/ecosystem-ads/banners")
    return (data?.banners || []) as Banner[]
  }, [])

  const createBanner = useCallback(async (formData: BannerFormData): Promise<Banner> => {
    const data = await adminFetch("/admin/ecosystem-ads/banners", {
      method: "POST",
      body: {
        name: formData.name,
        headline: formData.headline,
        cta_text: formData.cta_text,
        cta_url: formData.cta_url,
        status: formData.status,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        priority: formData.priority,
        product_ids: formData.product_ids,
        product_names: formData.product_names,
        creatives: formData.creatives,
      },
    })
    return data?.banner
  }, [])

  const updateBanner = useCallback(
    async (id: string, updates: Partial<BannerFormData>): Promise<Banner> => {
      const data = await adminFetch(`/admin/ecosystem-ads/banners/${id}`, {
        method: "POST",
        body: updates,
      })
      return data?.banner
    },
    []
  )

  const deleteBanner = useCallback(async (id: string): Promise<void> => {
    await adminFetch(`/admin/ecosystem-ads/banners/${id}`, {
      method: "DELETE",
    })
  }, [])

  const toggleBanner = useCallback(async (id: string): Promise<void> => {
    await adminFetch(`/admin/ecosystem-ads/banners/${id}/toggle`, {
      method: "POST",
    })
  }, [])

  // ─── Sites ───────────────────────────────────────────────────────────

  const fetchSites = useCallback(async (): Promise<EcosystemSite[]> => {
    const data = await adminFetch("/admin/ecosystem-ads/sites")
    return (data?.sites || []) as EcosystemSite[]
  }, [])

  const createSite = useCallback(
    async (subdomain: string, displayName: string): Promise<void> => {
      await adminFetch("/admin/ecosystem-ads/sites", {
        method: "POST",
        body: { subdomain, display_name: displayName },
      })
    },
    []
  )

  const deleteSite = useCallback(async (id: string): Promise<void> => {
    await adminFetch(`/admin/ecosystem-ads/sites/${id}`, {
      method: "DELETE",
    })
  }, [])

  const toggleSite = useCallback(async (id: string): Promise<void> => {
    await adminFetch(`/admin/ecosystem-ads/sites/${id}/toggle`, {
      method: "POST",
    })
  }, [])

  // ─── Slots ───────────────────────────────────────────────────────────

  const createSlot = useCallback(
    async (siteId: string, name: string, ratio: AspectRatio): Promise<void> => {
      await adminFetch("/admin/ecosystem-ads/slots", {
        method: "POST",
        body: { site_id: siteId, name, ratio },
      })
    },
    []
  )

  const assignSlot = useCallback(
    async (slotId: string, bannerId: string): Promise<void> => {
      await adminFetch(`/admin/ecosystem-ads/slots/${slotId}/assign`, {
        method: "POST",
        body: { banner_id: bannerId },
      })
    },
    []
  )

  const removeSlotAssignment = useCallback(async (slotId: string): Promise<void> => {
    await adminFetch(`/admin/ecosystem-ads/slots/${slotId}/assign`, {
      method: "DELETE",
    })
  }, [])

  // ─── Analytics ───────────────────────────────────────────────────────

  const fetchAnalytics = useCallback(
    async (
      period?: string
    ): Promise<{ analytics: BannerAnalytics[]; summary: AnalyticsSummary }> => {
      const query = period ? `?period=${period}` : ""
      const data = await adminFetch(`/admin/ecosystem-ads/analytics${query}`)
      return {
        analytics: data?.analytics || [],
        summary: data?.summary || {
          totalImpressions: 0,
          totalClicks: 0,
          avgCtr: 0,
          activeBanners: 0,
        },
      }
    },
    []
  )

  // ─── Social ──────────────────────────────────────────────────────────

  const fetchSocialAccounts = useCallback(async (): Promise<SocialAccount[]> => {
    const data = await adminFetch("/admin/ecosystem-ads/social/accounts")
    return (data?.accounts || []) as SocialAccount[]
  }, [])

  const fetchSocialConfig = useCallback(async (): Promise<SocialConfig> => {
    const data = await adminFetch("/admin/ecosystem-ads/social/config")
    return (data?.config || {}) as SocialConfig
  }, [])

  const saveSocialConfig = useCallback(
    async (platform: SocialPlatform, config: SocialPlatformConfig): Promise<void> => {
      // Read existing, merge, save
      const existing = await fetchSocialConfig()
      const updated = { ...existing, [platform]: config }
      await adminFetch("/admin/ecosystem-ads/social/config", {
        method: "POST",
        body: updated,
      })
    },
    []
  )

  const publishToSocial = useCallback(
    async (
      bannerId: string,
      platform: SocialPlatform,
      caption: string,
      meta: SocialPostMeta
    ): Promise<{ status: string; error?: string }> => {
      const data = await adminFetch("/admin/ecosystem-ads/social/publish", {
        method: "POST",
        body: { banner_id: bannerId, platform, caption, meta },
      })
      return {
        status: data?.post?.status || "failed",
        error: data?.post?.error,
      }
    },
    []
  )

  const fetchSocialPosts = useCallback(
    async (platform?: string): Promise<SocialPost[]> => {
      const query = platform ? `?platform=${platform}` : ""
      const data = await adminFetch(`/admin/ecosystem-ads/social/posts${query}`)
      return (data?.posts || []) as SocialPost[]
    },
    []
  )

  // ─── File Upload ─────────────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("files", file)

    const token = getAdminToken()
    const headers: HeadersInit = {}
    if (token) headers["Authorization"] = `Bearer ${token}`

    const res = await fetch(`${BACKEND_URL}/admin/uploads`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData,
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.files?.[0]?.url || ""
  }, [])

  // ─── Product Search (for banner product picker) ──────────────────────

  const searchProducts = useCallback(
    async (query: string): Promise<{ id: string; title: string }[]> => {
      const data = await adminFetch(
        `/admin/products?q=${encodeURIComponent(query)}&limit=10`
      )
      return (data?.products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
      }))
    },
    []
  )

  return {
    fetchBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBanner,
    fetchSites,
    createSite,
    deleteSite,
    toggleSite,
    createSlot,
    assignSlot,
    removeSlotAssignment,
    fetchAnalytics,
    fetchSocialAccounts,
    fetchSocialConfig,
    saveSocialConfig,
    publishToSocial,
    fetchSocialPosts,
    uploadFile,
    searchProducts,
  }
}
