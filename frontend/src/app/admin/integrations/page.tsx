"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminIntegrations } from "@/components/admin/integrations"
import { useAdminIntegrations } from "@/hooks/useAdminIntegrations"
import { primary, earth, fonts } from "@/lib/theme"
import type {
  IntegrationTab,
  IntegrationsConfig,
  SEODefaults,
  OpenGraphDefaults,
  MarketingTag,
} from "@/types/admin-integrations"

export default function IntegrationsSEOPage() {
  const hook = useAdminIntegrations()

  const [config, setConfig] = useState<IntegrationsConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<IntegrationTab>("integrations")
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const cfg = await hook.fetchConfig()
      setConfig(cfg)
    } catch (e: any) {
      setError(e?.message || "Failed to load integrations config")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleConnection = async (integrationId: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleConnection(integrationId, config)
      setConfig(updated)
      const integ = updated.integrations.find((i) => i.id === integrationId)
      showToast(
        integ?.isConnected
          ? `${integ.name} connected`
          : `${integ?.name} disconnected`
      )
    } catch {
      showToast("Failed to toggle integration")
    }
  }

  const handleTestConnection = async (integrationId: string) => {
    if (!config) return
    try {
      const { valid, updated } = await hook.testConnection(
        integrationId,
        config
      )
      setConfig(updated)
      const integ = updated.integrations.find((i) => i.id === integrationId)
      showToast(
        valid
          ? `${integ?.name}: credentials look valid`
          : `${integ?.name}: credentials failed validation — check your config`
      )
    } catch {
      showToast("Test failed — could not save result")
    }
  }

  const handleSaveIntegrationConfig = async (
    integrationId: string,
    fields: Record<string, string>
  ) => {
    if (!config) return
    try {
      const updated = await hook.saveIntegrationConfig(
        integrationId,
        fields,
        config
      )
      setConfig(updated)
      showToast("Integration config saved")
    } catch {
      showToast("Failed to save config")
    }
  }

  const handleSaveSEO = async (seo: SEODefaults) => {
    if (!config) return
    try {
      const updated = await hook.saveSEO(seo, config)
      setConfig(updated)
      showToast("SEO settings saved")
    } catch {
      showToast("Failed to save SEO settings")
    }
  }

  const handleSaveOpenGraph = async (og: OpenGraphDefaults) => {
    if (!config) return
    try {
      const updated = await hook.saveOpenGraph(og, config)
      setConfig(updated)
      showToast("Social settings saved")
    } catch {
      showToast("Failed to save social settings")
    }
  }

  const handleToggleTag = async (tagId: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleTag(tagId, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle tag")
    }
  }

  const handleAddTag = async (tag: Omit<MarketingTag, "id">) => {
    if (!config) return
    try {
      const updated = await hook.addTag(tag, config)
      setConfig(updated)
      showToast("Marketing tag added")
    } catch {
      showToast("Failed to add tag")
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!config) return
    try {
      const updated = await hook.removeTag(tagId, config)
      setConfig(updated)
      showToast("Tag removed")
    } catch {
      showToast("Failed to remove tag")
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: `3px solid ${primary[100]}`,
            borderTopColor: primary[500],
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    )
  }

  if (error || !config) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: earth[400], fontFamily: fonts.body }}>
          {error || "Failed to load configuration"}
        </p>
        <button
          onClick={loadConfig}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1.25rem",
            backgroundColor: primary[500],
            color: "#fff",
            borderRadius: "0.5rem",
            fontFamily: fonts.body,
            fontSize: "0.875rem",
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <AdminIntegrations
        activeTab={activeTab}
        integrations={config.integrations}
        seoDefaults={config.seoDefaults}
        openGraph={config.openGraph}
        marketingTags={config.marketingTags}
        onChangeTab={setActiveTab}
        onToggleConnection={handleToggleConnection}
        onTestConnection={handleTestConnection}
        onSaveIntegrationConfig={handleSaveIntegrationConfig}
        onSaveSEO={handleSaveSEO}
        onSaveOpenGraph={handleSaveOpenGraph}
        onToggleTag={handleToggleTag}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            backgroundColor: primary[500],
            color: "#fff",
            padding: "0.75rem 1.25rem",
            borderRadius: "0.5rem",
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            boxShadow:
              "0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)",
            zIndex: 9999,
            maxWidth: "320px",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
