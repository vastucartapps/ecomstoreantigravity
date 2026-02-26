/** Status of an integration connection */
export type IntegrationStatus = "active" | "error" | "inactive"

/** Tab within the Integrations & SEO section */
export type IntegrationTab = "integrations" | "seo"

/** A third-party integration */
export interface Integration {
  id: string
  name: string
  icon: string
  description: string
  isConnected: boolean
  status: IntegrationStatus
  configFields: Record<string, string>
  lastSynced: string | null
}

/** Site-wide SEO defaults */
export interface SEODefaults {
  siteTitleTemplate: string
  metaDescription: string
  robotsTxt: string
  sitemapEnabled: boolean
  sitemapLastGenerated: string
}

/** Open Graph and social card defaults */
export interface OpenGraphDefaults {
  defaultImage: string
  defaultTitle: string
  defaultDescription: string
  twitterHandle: string
}

/** A marketing/performance tag */
export interface MarketingTag {
  id: string
  name: string
  platform: string
  pixelId: string
  isActive: boolean
}

/** Full integrations config stored in store.metadata.integrations_config */
export interface IntegrationsConfig {
  integrations: Integration[]
  seoDefaults: SEODefaults
  openGraph: OpenGraphDefaults
  marketingTags: MarketingTag[]
}

/** Public-safe integration fields for storefront script injection */
export interface PublicIntegrationConfig {
  ga4: { isConnected: boolean; measurementId: string } | null
  metaPixel: { isConnected: boolean; pixelId: string } | null
  chatwoot: { isConnected: boolean; websiteToken: string; baseUrl: string } | null
  seoDefaults: SEODefaults | null
  openGraph: OpenGraphDefaults | null
}

/** GMC sync status (stored in store.metadata.gmc_sync_status) */
export interface GmcSyncStatus {
  lastSync: string | null
  lastSyncProducts: number
  lastSyncErrors: number
  status: "success" | "error" | "syncing" | null
  errors?: string[]
  syncStarted?: string
}

/** GMC error report (stored in store.metadata.gmc_error_report) */
export interface GmcErrorReport {
  checkedAt: string
  totalProducts: number
  disapprovedCount: number
  disapproved: { productId: string; title: string; issues: string[] }[]
}

/** Full GMC status response from /admin/integrations/gmc/status */
export interface GmcStatusResponse {
  isConfigured: boolean
  merchantId: string | null
  feedUrl: string
  syncStatus: GmcSyncStatus | null
  errorReport: GmcErrorReport | null
}

/** Meta sync status (stored in store.metadata.meta_sync_status) */
export interface MetaSyncStatus {
  lastSync: string | null
  lastSyncProducts: number
  lastSyncErrors: number
  status: "success" | "error" | "syncing" | null
  errors: string[]
  syncStarted?: string
}

/** Meta error report (stored in store.metadata.meta_error_report) */
export interface MetaErrorReport {
  checkedAt: string
  totalItems: number
  errorCount: number
  warnings: { productId: string; title: string; issues: string[] }[]
}

/** Full Meta status response from /admin/integrations/meta/status */
export interface MetaStatusResponse {
  isConfigured: boolean
  catalogId: string | null
  feedUrl: string
  syncStatus: MetaSyncStatus | null
  errorReport: MetaErrorReport | null
}

/** Props for the AdminIntegrations component */
export interface AdminIntegrationsProps {
  activeTab: IntegrationTab
  integrations: Integration[]
  seoDefaults: SEODefaults
  openGraph: OpenGraphDefaults
  marketingTags: MarketingTag[]
  gmcStatus?: GmcStatusResponse | null
  metaStatus?: MetaStatusResponse | null
  onChangeTab?: (tab: IntegrationTab) => void
  onToggleConnection?: (integrationId: string) => Promise<void>
  onTestConnection?: (integrationId: string) => Promise<void>
  onSaveIntegrationConfig?: (
    integrationId: string,
    fields: Record<string, string>
  ) => Promise<void>
  onSaveSEO?: (seo: SEODefaults) => Promise<void>
  onSaveOpenGraph?: (og: OpenGraphDefaults) => Promise<void>
  onToggleTag?: (tagId: string) => Promise<void>
  onAddTag?: (tag: Omit<MarketingTag, "id">) => Promise<void>
  onRemoveTag?: (tagId: string) => Promise<void>
  onGmcSync?: () => Promise<void>
  onMetaSync?: () => Promise<void>
}
