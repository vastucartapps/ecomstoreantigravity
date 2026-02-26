"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AdminIntegrations } from "@/components/admin/integrations"
import { useAdminIntegrations } from "@/hooks/useAdminIntegrations"
import { primary, earth, fonts } from "@/lib/theme"
import type {
  IntegrationTab,
  IntegrationsConfig,
  SEODefaults,
  OpenGraphDefaults,
  MarketingTag,
  GmcStatusResponse,
  MetaStatusResponse,
} from "@/types/admin-integrations"

export default function IntegrationsSEOPage() {
  const hook = useAdminIntegrations()

  const [config, setConfig] = useState<IntegrationsConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<IntegrationTab>("integrations")
  const [toast, setToast] = useState<string | null>(null)
  const [gmcStatus, setGmcStatus] = useState<GmcStatusResponse | null>(null)
  const gmcPollRef = useRef<NodeJS.Timeout | null>(null)
  const [metaStatus, setMetaStatus] = useState<MetaStatusResponse | null>(null)
  const metaPollRef = useRef<NodeJS.Timeout | null>(null)

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

  const refreshGmcStatus = useCallback(async () => {
    try {
      const status = await hook.fetchGmcStatus()
      setGmcStatus(status)
      return status
    } catch {
      return null
    }
  }, [])

  const refreshMetaStatus = useCallback(async () => {
    try {
      const status = await hook.fetchMetaStatus()
      setMetaStatus(status)
      return status
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    loadConfig()
    refreshGmcStatus()
    refreshMetaStatus()
  }, [loadConfig, refreshGmcStatus, refreshMetaStatus])

  // Poll GMC status every 10s while a sync is in progress
  useEffect(() => {
    if (gmcStatus?.syncStatus?.status === "syncing") {
      gmcPollRef.current = setInterval(async () => {
        const updated = await refreshGmcStatus()
        if (updated?.syncStatus?.status !== "syncing") {
          if (gmcPollRef.current) clearInterval(gmcPollRef.current)
        }
      }, 10_000)
    } else {
      if (gmcPollRef.current) clearInterval(gmcPollRef.current)
    }
    return () => {
      if (gmcPollRef.current) clearInterval(gmcPollRef.current)
    }
  }, [gmcStatus?.syncStatus?.status, refreshGmcStatus])

  // Poll Meta status every 10s while a sync is in progress
  useEffect(() => {
    if (metaStatus?.syncStatus?.status === "syncing") {
      metaPollRef.current = setInterval(async () => {
        const updated = await refreshMetaStatus()
        if (updated?.syncStatus?.status !== "syncing") {
          if (metaPollRef.current) clearInterval(metaPollRef.current)
        }
      }, 10_000)
    } else {
      if (metaPollRef.current) clearInterval(metaPollRef.current)
    }
    return () => {
      if (metaPollRef.current) clearInterval(metaPollRef.current)
    }
  }, [metaStatus?.syncStatus?.status, refreshMetaStatus])

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

  const handleGmcSync = async () => {
    try {
      await hook.triggerGmcSync()
      showToast("GMC sync started — checking status…")
      // Optimistically mark as syncing, then start polling
      setGmcStatus((prev) =>
        prev
          ? {
              ...prev,
              syncStatus: {
                ...(prev.syncStatus || {}),
                status: "syncing",
                syncStarted: new Date().toISOString(),
                lastSync: prev.syncStatus?.lastSync || null,
                lastSyncProducts: prev.syncStatus?.lastSyncProducts || 0,
                lastSyncErrors: prev.syncStatus?.lastSyncErrors || 0,
              },
            }
          : prev
      )
      // Refresh status after 3s to see initial progress
      setTimeout(refreshGmcStatus, 3000)
    } catch {
      showToast("Failed to trigger GMC sync — check configuration")
    }
  }

  const handleMetaSync = async () => {
    try {
      await hook.triggerMetaSync()
      showToast("Meta catalogue sync started — checking status…")
      // Optimistically mark as syncing, then start polling
      setMetaStatus((prev) =>
        prev
          ? {
              ...prev,
              syncStatus: {
                ...(prev.syncStatus || {}),
                status: "syncing",
                syncStarted: new Date().toISOString(),
                lastSync: prev.syncStatus?.lastSync || null,
                lastSyncProducts: prev.syncStatus?.lastSyncProducts || 0,
                lastSyncErrors: prev.syncStatus?.lastSyncErrors || 0,
                errors: prev.syncStatus?.errors || [],
              },
            }
          : prev
      )
      // Refresh status after 3s to see initial progress
      setTimeout(refreshMetaStatus, 3000)
    } catch {
      showToast("Failed to trigger Meta sync — check configuration")
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
        gmcStatus={gmcStatus}
        metaStatus={metaStatus}
        onChangeTab={setActiveTab}
        onToggleConnection={handleToggleConnection}
        onTestConnection={handleTestConnection}
        onSaveIntegrationConfig={handleSaveIntegrationConfig}
        onSaveSEO={handleSaveSEO}
        onSaveOpenGraph={handleSaveOpenGraph}
        onToggleTag={handleToggleTag}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        onGmcSync={handleGmcSync}
        onMetaSync={handleMetaSync}
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
