"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminNotifications } from "@/components/admin/notifications"
import { useAdminNotifications } from "@/hooks/useAdminNotifications"
import { primary, earth, fonts } from "@/lib/theme"
import type {
  ChannelTab,
  NotificationsConfig,
  SMSConfig,
  WhatsAppConfig,
  PushConfig,
  InAppAnnouncement,
  NotificationsIntegrationConfig,
} from "@/types/admin-notifications"

export default function NotificationsCommunicationPage() {
  const hook = useAdminNotifications()

  const [config, setConfig] = useState<NotificationsConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeChannel, setActiveChannel] = useState<ChannelTab>("email")
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
      setError(e?.message || "Failed to load notifications config")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleToggleEmailTemplate = async (id: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleEmailTemplate(id, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle email template")
    }
  }

  const handleEditEmailTemplate = async (id: string, subject: string, body: string) => {
    if (!config) return
    try {
      const updated = await hook.editEmailTemplate(id, subject, body, config)
      setConfig(updated)
      showToast("Email template saved")
    } catch {
      showToast("Failed to save email template")
    }
  }

  const handleToggleSMS = async (enabled: boolean) => {
    if (!config) return
    try {
      const updated = await hook.toggleSMS(enabled, config)
      setConfig(updated)
      showToast(enabled ? "SMS enabled" : "SMS disabled")
    } catch {
      showToast("Failed to toggle SMS")
    }
  }

  const handleSaveSMSConfig = async (smsConfig: SMSConfig) => {
    if (!config) return
    try {
      const updated = await hook.saveSMSConfig(smsConfig, config)
      setConfig(updated)
      showToast("SMS config saved")
    } catch {
      showToast("Failed to save SMS config")
    }
  }

  const handleToggleSMSTemplate = async (id: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleSMSTemplate(id, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle SMS template")
    }
  }

  const handleEditSMSTemplate = async (id: string, template: string) => {
    if (!config) return
    try {
      const updated = await hook.editSMSTemplate(id, template, config)
      setConfig(updated)
      showToast("SMS template saved")
    } catch {
      showToast("Failed to save SMS template")
    }
  }

  const handleToggleWhatsApp = async (enabled: boolean) => {
    if (!config) return
    try {
      const updated = await hook.toggleWhatsApp(enabled, config)
      setConfig(updated)
      showToast(enabled ? "WhatsApp enabled" : "WhatsApp disabled")
    } catch {
      showToast("Failed to toggle WhatsApp")
    }
  }

  const handleSaveWhatsAppConfig = async (whatsappConfig: WhatsAppConfig) => {
    if (!config) return
    try {
      const updated = await hook.saveWhatsAppConfig(whatsappConfig, config)
      setConfig(updated)
      showToast("WhatsApp config saved")
    } catch {
      showToast("Failed to save WhatsApp config")
    }
  }

  const handleToggleWhatsAppTemplate = async (id: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleWhatsAppTemplate(id, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle WhatsApp template")
    }
  }

  const handleEditWhatsAppTemplate = async (id: string, template: string) => {
    if (!config) return
    try {
      const updated = await hook.editWhatsAppTemplate(id, template, config)
      setConfig(updated)
      showToast("WhatsApp template saved")
    } catch {
      showToast("Failed to save WhatsApp template")
    }
  }

  const handleTogglePush = async (enabled: boolean) => {
    if (!config) return
    try {
      const updated = await hook.togglePush(enabled, config)
      setConfig(updated)
      showToast(enabled ? "Push notifications enabled" : "Push notifications disabled")
    } catch {
      showToast("Failed to toggle push notifications")
    }
  }

  const handleSavePushConfig = async (pushConfig: PushConfig) => {
    if (!config) return
    try {
      const updated = await hook.savePushConfig(pushConfig, config)
      setConfig(updated)
      showToast("Push config saved")
    } catch {
      showToast("Failed to save push config")
    }
  }

  const handleTogglePushTemplate = async (id: string) => {
    if (!config) return
    try {
      const updated = await hook.togglePushTemplate(id, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle push template")
    }
  }

  const handleEditPushTemplate = async (id: string, template: string) => {
    if (!config) return
    try {
      const updated = await hook.editPushTemplate(id, template, config)
      setConfig(updated)
      showToast("Push template saved")
    } catch {
      showToast("Failed to save push template")
    }
  }

  const handleToggleAnnouncement = async (id: string) => {
    if (!config) return
    try {
      const updated = await hook.toggleAnnouncement(id, config)
      setConfig(updated)
    } catch {
      showToast("Failed to toggle announcement")
    }
  }

  const handleCreateAnnouncement = async (
    announcement: Omit<InAppAnnouncement, "id">
  ) => {
    if (!config) return
    try {
      const updated = await hook.createAnnouncement(announcement, config)
      setConfig(updated)
      showToast("Announcement created")
    } catch {
      showToast("Failed to create announcement")
    }
  }

  const handleSaveIntegrations = async (
    integrations: NotificationsIntegrationConfig
  ) => {
    if (!config) return
    try {
      const updated = await hook.saveIntegrations(integrations, config)
      setConfig(updated)
      showToast("Integration settings saved")
    } catch {
      showToast("Failed to save integration settings")
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
            border: "none",
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
      <AdminNotifications
        activeChannel={activeChannel}
        emailTemplates={config.emailTemplates}
        smsConfig={config.smsConfig}
        whatsappConfig={config.whatsappConfig}
        pushConfig={config.pushConfig}
        inAppAnnouncements={config.inAppAnnouncements}
        integrations={config.integrations}
        onChangeChannel={setActiveChannel}
        onToggleEmailTemplate={handleToggleEmailTemplate}
        onEditEmailTemplate={handleEditEmailTemplate}
        onToggleSMS={handleToggleSMS}
        onSaveSMSConfig={handleSaveSMSConfig}
        onToggleSMSTemplate={handleToggleSMSTemplate}
        onEditSMSTemplate={handleEditSMSTemplate}
        onToggleWhatsApp={handleToggleWhatsApp}
        onSaveWhatsAppConfig={handleSaveWhatsAppConfig}
        onToggleWhatsAppTemplate={handleToggleWhatsAppTemplate}
        onEditWhatsAppTemplate={handleEditWhatsAppTemplate}
        onTogglePush={handleTogglePush}
        onSavePushConfig={handleSavePushConfig}
        onTogglePushTemplate={handleTogglePushTemplate}
        onEditPushTemplate={handleEditPushTemplate}
        onToggleAnnouncement={handleToggleAnnouncement}
        onCreateAnnouncement={handleCreateAnnouncement}
        onSaveIntegrations={handleSaveIntegrations}
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
