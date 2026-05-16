import { adminFetch } from "@/lib/medusa"
import { getSiteUrl } from "@/lib/brand-defaults"
import type {
  Integration,
  IntegrationsConfig,
  SEODefaults,
  OpenGraphDefaults,
  MarketingTag,
  GmcStatusResponse,
  MetaStatusResponse,
  GA4ReportResponse,
} from "@/types/admin-integrations"

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_INTEGRATIONS: Integration[] = [
  {
    id: "ga4",
    name: "Google Analytics 4",
    icon: "bar-chart-2",
    description:
      "Track website traffic, user behaviour, and conversion events with GA4.",
    isConnected: false,
    status: "inactive",
    configFields: { measurementId: "", propertyId: "", serviceAccountKey: "" },
    lastSynced: null,
  },
  {
    id: "meta-pixel",
    name: "Meta Pixel",
    icon: "eye",
    description:
      "Track conversions, optimise ads, and build audiences for Meta campaigns.",
    isConnected: false,
    status: "inactive",
    configFields: { pixelId: "", conversionApiToken: "" },
    lastSynced: null,
  },
  {
    id: "meta",
    name: "Meta Product Catalogue",
    icon: "share-2",
    description:
      "Sync product catalogue to Meta Commerce Manager for Facebook and Instagram Shopping. Supports real-time Graph API push + TSV feed.",
    isConnected: false,
    status: "inactive",
    configFields: {
      catalogId: "",
      accessToken: "",
    },
    lastSynced: null,
  },
  {
    id: "gmc",
    name: "Google Merchant Centre",
    icon: "shopping-bag",
    description:
      "Sync product feed for Google Shopping listings and free product listings. Supports real-time Content API push + XML feed.",
    isConnected: false,
    status: "inactive",
    configFields: {
      merchantId: "",
      serviceAccountKey: "",
      targetCountry: "IN",
      feedLabel: "IN",
    },
    lastSynced: null,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: "message-circle",
    description:
      "Send order confirmations, shipping updates, and support messages via WhatsApp.",
    isConnected: false,
    status: "inactive",
    configFields: { phoneNumber: "", apiKey: "" },
    lastSynced: null,
  },
  {
    id: "chatwoot",
    name: "Chatwoot",
    icon: "headphones",
    description:
      "Live chat widget and helpdesk integration for customer support.",
    isConnected: false,
    status: "inactive",
    configFields: {
      websiteToken: "",
      baseUrl: "https://app.chatwoot.com",
    },
    lastSynced: null,
  },
]

const DEFAULT_SEO: SEODefaults = {
  siteTitleTemplate: "%s | VastuCart — Vastu-Aligned Home & Living",
  metaDescription:
    "Shop Vastu-aligned home décor, furniture, and wellness products at VastuCart. Handpicked items to bring positive energy and harmony to every room.",
  // Sitemap URL is built from the canonical site URL (env-driven via
  // NEXT_PUBLIC_SITE_URL → BRAND_DEFAULTS.siteUrl) so a different domain
  // doesn't end up pointing at vastucart.com sitemap by accident.
  robotsTxt: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /cart/\nDisallow: /checkout/\nDisallow: /api/\n\nSitemap: ${getSiteUrl()}/sitemap.xml`,
  sitemapEnabled: true,
  sitemapLastGenerated: new Date().toISOString(),
}

const DEFAULT_OG: OpenGraphDefaults = {
  defaultImage: "",
  defaultTitle: "VastuCart — Vastu-Aligned Home & Living",
  defaultDescription:
    "Discover handpicked home décor and wellness products aligned with Vastu principles for positive energy in every space.",
  twitterHandle: "@vastucart",
}

const DEFAULT_CONFIG: IntegrationsConfig = {
  integrations: DEFAULT_INTEGRATIONS,
  seoDefaults: DEFAULT_SEO,
  openGraph: DEFAULT_OG,
  marketingTags: [],
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Client-side format validation for each integration type.
 * Returns true if config fields look valid.
 */
function validateIntegration(
  id: string,
  fields: Record<string, string>
): boolean {
  switch (id) {
    case "ga4":
      return /^G-[A-Z0-9]{4,}$/i.test(fields.measurementId || "") && (fields.propertyId || "").trim().length > 0
    case "meta-pixel":
      return /^\d{13,16}$/.test(fields.pixelId || "")
    case "meta":
      // catalogId must be 13-16 digits; accessToken must be present
      return (
        /^\d{13,16}$/.test(fields.catalogId || "") &&
        (fields.accessToken || "").length > 10
      )
    case "gmc":
      // merchantId required; serviceAccountKey optional (needed for Content API push)
      return /^\d{5,}$/.test(fields.merchantId || "")
    case "whatsapp":
      return (
        (fields.phoneNumber || "").replace(/\D/g, "").length >= 10 &&
        (fields.apiKey || "").length >= 10
      )
    case "chatwoot":
      return (
        (fields.websiteToken || "").length >= 6 &&
        /^https?:\/\/.+/.test(fields.baseUrl || "")
      )
    default:
      return Object.values(fields).some((v) => v.trim().length > 0)
  }
}

// ─── Store helpers ────────────────────────────────────────────────────────────

async function readStore() {
  const res = await adminFetch("/admin/stores", {
    method: "GET",
  })
  const data = res as { stores?: Array<Record<string, unknown>> }
  return data.stores?.[0]
}

async function writeConfig(config: IntegrationsConfig) {
  const store = await readStore()
  if (!store) throw new Error("Store not found")
  const existingMeta: Record<string, unknown> = (store.metadata as Record<string, unknown>) ?? {}
  await adminFetch(`/admin/stores/${store.id}`, {
    method: "POST",
    body: { metadata: { ...existingMeta, integrations_config: config } },
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminIntegrations() {
  /**
   * Fetch integrations config from store metadata.
   * Falls back to DEFAULT_CONFIG if not yet configured.
   */
  async function fetchConfig(): Promise<IntegrationsConfig> {
    const store = await readStore()
    const saved = (store?.metadata as Record<string, unknown> | undefined)?.integrations_config as IntegrationsConfig | undefined

    if (!saved) return { ...DEFAULT_CONFIG }

    // Merge saved integrations with defaults so new integrations are always present
    // Also merge configFields so new fields added to defaults appear in the UI
    const savedMap = new Map<string, Integration>(
      (saved.integrations || []).map((i: Integration) => [i.id, i])
    )
    const mergedIntegrations = DEFAULT_INTEGRATIONS.map((def) => {
      if (!savedMap.has(def.id)) return def
      const savedInteg = savedMap.get(def.id) as Integration
      return {
        ...savedInteg,
        // Merge configFields: default keys define the schema, saved values fill them in
        configFields: {
          ...def.configFields,
          ...savedInteg.configFields,
        },
      }
    })

    return {
      integrations: mergedIntegrations,
      seoDefaults: saved.seoDefaults || DEFAULT_SEO,
      openGraph: saved.openGraph || DEFAULT_OG,
      marketingTags: saved.marketingTags || [],
    }
  }

  /**
   * Toggle an integration's isConnected flag.
   * Disconnecting sets status to 'inactive'; connecting sets to 'active'
   * only if config fields are valid, otherwise 'error'.
   */
  async function toggleConnection(
    integrationId: string,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const updated: IntegrationsConfig = {
      ...currentConfig,
      integrations: currentConfig.integrations.map((i) => {
        if (i.id !== integrationId) return i
        const nowConnected = !i.isConnected
        const valid = nowConnected
          ? validateIntegration(i.id, i.configFields)
          : false
        return {
          ...i,
          isConnected: nowConnected,
          status: nowConnected
            ? valid
              ? "active"
              : "error"
            : "inactive",
        }
      }),
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Validate an integration's config fields client-side.
   * Updates status to 'active' or 'error' and persists.
   */
  async function testConnection(
    integrationId: string,
    currentConfig: IntegrationsConfig
  ): Promise<{ valid: boolean; updated: IntegrationsConfig }> {
    const integration = currentConfig.integrations.find(
      (i) => i.id === integrationId
    )
    if (!integration)
      return { valid: false, updated: currentConfig }

    const valid = validateIntegration(integrationId, integration.configFields)
    const updated: IntegrationsConfig = {
      ...currentConfig,
      integrations: currentConfig.integrations.map((i) =>
        i.id === integrationId
          ? { ...i, status: valid ? "active" : "error" }
          : i
      ),
    }
    await writeConfig(updated)
    return { valid, updated }
  }

  /**
   * Save updated config fields for an integration.
   * If the fields pass client-side validation, automatically marks the
   * integration as connected + active so the admin does not need to click
   * the toggle separately after entering their IDs.
   */
  async function saveIntegrationConfig(
    integrationId: string,
    fields: Record<string, string>,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const valid = validateIntegration(integrationId, fields)
    const updated: IntegrationsConfig = {
      ...currentConfig,
      integrations: currentConfig.integrations.map((i) =>
        i.id === integrationId
          ? {
              ...i,
              configFields: fields,
              // Auto-connect when credentials are valid; preserve existing state otherwise
              ...(valid
                ? { isConnected: true, status: "active" as const }
                : {}),
            }
          : i
      ),
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Save SEO defaults (title template, meta description, robots.txt, sitemap).
   */
  async function saveSEO(
    seo: SEODefaults,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const updated: IntegrationsConfig = {
      ...currentConfig,
      seoDefaults: {
        ...seo,
        sitemapLastGenerated: new Date().toISOString(),
      },
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Save Open Graph and Twitter Card defaults.
   */
  async function saveOpenGraph(
    og: OpenGraphDefaults,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const updated: IntegrationsConfig = { ...currentConfig, openGraph: og }
    await writeConfig(updated)
    return updated
  }

  /**
   * Toggle a marketing tag's isActive flag.
   */
  async function toggleTag(
    tagId: string,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const updated: IntegrationsConfig = {
      ...currentConfig,
      marketingTags: currentConfig.marketingTags.map((t) =>
        t.id === tagId ? { ...t, isActive: !t.isActive } : t
      ),
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Add a new marketing tag.
   */
  async function addTag(
    tag: Omit<MarketingTag, "id">,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const newTag: MarketingTag = {
      ...tag,
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }
    const updated: IntegrationsConfig = {
      ...currentConfig,
      marketingTags: [...currentConfig.marketingTags, newTag],
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Remove a marketing tag by ID.
   */
  async function removeTag(
    tagId: string,
    currentConfig: IntegrationsConfig
  ): Promise<IntegrationsConfig> {
    const updated: IntegrationsConfig = {
      ...currentConfig,
      marketingTags: currentConfig.marketingTags.filter(
        (t) => t.id !== tagId
      ),
    }
    await writeConfig(updated)
    return updated
  }

  /**
   * Fetch real-time GMC sync status + error report from the backend.
   * Reads from store.metadata.gmc_sync_status and gmc_error_report.
   */
  async function fetchGmcStatus(): Promise<GmcStatusResponse> {
    return adminFetch<GmcStatusResponse>("/admin/integrations/gmc/status")
  }

  /**
   * Trigger an immediate full catalog sync to Google Merchant Centre.
   * The backend runs this asynchronously — poll fetchGmcStatus to track progress.
   */
  async function triggerGmcSync(): Promise<void> {
    await adminFetch("/admin/integrations/gmc/sync", { method: "POST" })
  }

  /**
   * Fetch real-time Meta catalogue sync status + diagnostics from the backend.
   * Reads from store.metadata.meta_sync_status and meta_error_report.
   */
  async function fetchMetaStatus(): Promise<MetaStatusResponse> {
    return adminFetch<MetaStatusResponse>("/admin/integrations/meta/status")
  }

  /**
   * Trigger an immediate full catalog sync to Meta Commerce Catalogue.
   * The backend runs this asynchronously — poll fetchMetaStatus to track progress.
   */
  async function triggerMetaSync(): Promise<void> {
    await adminFetch("/admin/integrations/meta/sync", { method: "POST" })
  }

  /**
   * Fetch GA4 analytics report for the last N days (default 30).
   * Backend reads propertyId + serviceAccountKey from store metadata.
   */
  async function fetchGa4Report(days = 30): Promise<GA4ReportResponse> {
    return adminFetch<GA4ReportResponse>(`/admin/analytics/ga4?days=${days}`)
  }

  return {
    fetchConfig,
    toggleConnection,
    testConnection,
    saveIntegrationConfig,
    saveSEO,
    saveOpenGraph,
    toggleTag,
    addTag,
    removeTag,
    fetchGmcStatus,
    triggerGmcSync,
    fetchMetaStatus,
    triggerMetaSync,
    fetchGa4Report,
  }
}
