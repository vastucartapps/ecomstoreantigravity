export type AdTab = "banners" | "placements" | "analytics" | "social"
export type BannerStatus = "draft" | "scheduled" | "live" | "expired"
export type AspectRatio = "1:1" | "16:9" | "9:16" | "16:3" | "4:3" | "2:3"
export type SocialPlatform = "pinterest" | "instagram" | "facebook" | "twitter" | "threads"

export interface BannerCreative {
  ratio: AspectRatio
  imageUrl: string
  width: number
  height: number
}

export interface Banner {
  id: string
  name: string
  headline: string
  cta_text: string
  cta_url: string
  status: BannerStatus
  is_active: boolean
  start_date: string | null
  end_date: string | null
  priority: number
  product_ids: string[]
  product_names: string[]
  creatives: BannerCreative[]
  placements: string[]
  impressions: number
  clicks: number
  created_at: string
}

export interface PlacementSlot {
  id: string
  site_id: string
  name: string
  ratio: AspectRatio
  is_active: boolean
  current_banner_id: string | null
  current_banner_name: string | null
}

export interface EcosystemSite {
  id: string
  subdomain: string
  display_name: string
  is_active: boolean
  slots: PlacementSlot[]
}

export interface BannerAnalytics {
  bannerId: string
  bannerName: string
  site: string
  impressions: number
  clicks: number
  ctr: number
  period: string
}

export interface AnalyticsSummary {
  totalImpressions: number
  totalClicks: number
  avgCtr: number
  activeBanners: number
}

export interface SocialAccount {
  platform: SocialPlatform
  isConnected: boolean
  username: string
  displayName: string
  preferredRatio: AspectRatio
}

export interface SocialPostMeta {
  title: string
  headline: string
  description: string
  linkUrl: string
  ctaText: string
  hashtags: string
  altText: string
}

export interface SocialPost {
  id: string
  banner_id: string
  banner_name: string
  platform: SocialPlatform
  post_url: string
  status: "published" | "pending" | "failed"
  published_at: string | null
  caption: string
  meta: SocialPostMeta
  created_at: string
}

export interface SocialPlatformConfig {
  access_token: string
  username: string
  display_name: string
  api_key?: string
  api_secret?: string
  access_token_secret?: string
  page_id?: string
  ig_user_id?: string
  user_id?: string
  board_id?: string
}

export type SocialConfig = Partial<Record<SocialPlatform, SocialPlatformConfig>>

export interface BannerFormData {
  name: string
  headline: string
  cta_text: string
  cta_url: string
  status: BannerStatus
  is_active: boolean
  start_date: string
  end_date: string
  priority: number
  product_ids: string[]
  product_names: string[]
  creatives: BannerCreative[]
}

export interface AdminEcosystemAdsProps {
  activeTab: AdTab
  banners: Banner[]
  sites: EcosystemSite[]
  analytics: BannerAnalytics[]
  analyticsSummary: AnalyticsSummary
  socialAccounts: SocialAccount[]
  socialPosts: SocialPost[]
  isLoading: boolean

  onChangeTab: (tab: AdTab) => void
  onCreateBanner: (data: BannerFormData) => Promise<void>
  onEditBanner: (id: string, data: Partial<BannerFormData>) => Promise<void>
  onDeleteBanner: (id: string) => Promise<void>
  onToggleBanner: (id: string) => Promise<void>
  onCreateSite: (subdomain: string, displayName: string) => Promise<void>
  onDeleteSite: (id: string) => Promise<void>
  onToggleSite: (id: string) => Promise<void>
  onCreateSlot: (siteId: string, name: string, ratio: AspectRatio) => Promise<void>
  onAssignPlacement: (slotId: string, bannerId: string) => Promise<void>
  onRemovePlacement: (slotId: string) => Promise<void>
  onSaveSocialConfig: (platform: SocialPlatform, config: SocialPlatformConfig) => Promise<void>
  onPublishToSocial: (bannerId: string, platform: SocialPlatform, caption: string, meta: SocialPostMeta) => Promise<void>
  onFetchAnalytics: (period?: string) => Promise<void>
  onUploadFile: (file: File) => Promise<string>
  onSearchProducts: (query: string) => Promise<{ id: string; title: string }[]>
}
