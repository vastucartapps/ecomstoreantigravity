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

/** Props for the AdminIntegrations component */
export interface AdminIntegrationsProps {
  activeTab: IntegrationTab
  integrations: Integration[]
  seoDefaults: SEODefaults
  openGraph: OpenGraphDefaults
  marketingTags: MarketingTag[]
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
}
