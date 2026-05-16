"use client"

import { useState, useEffect } from "react"
import { adminFetch } from "@/lib/medusa"
import { primary, earth, fonts, semantic } from "@/lib/theme"
import { Save, Store, Mail, Phone, Globe, Key, RefreshCw } from "lucide-react"
import { ThemeSelect } from "@/components/ui/ThemeSelect"
import { BRAND_DEFAULTS } from "@/lib/brand-defaults"

interface StoreSettings {
  name: string
  supportEmail: string
  supportPhone: string
  defaultCurrency: string
  timezone: string
}

// Single source of truth for the currency / timezone dropdowns. Extracting
// these so every admin form that wants the same options can import the same
// list instead of repeating the inline literal — and adding "Eurozone" or
// "Asia/Singapore" later is a one-line change here, not a hunt across screens.
const CURRENCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
]

const TIMEZONE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+5:30)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+4)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+8)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
]

// Pull initial values from the canonical seed so a fresh admin doesn't see
// a placeholder phone number that conflicts with the actual brand contact.
const DEFAULT_SETTINGS: StoreSettings = {
  name: BRAND_DEFAULTS.storeName,
  supportEmail: BRAND_DEFAULTS.contactEmail,
  supportPhone: BRAND_DEFAULTS.contactPhone,
  defaultCurrency: "INR",
  timezone: "Asia/Kolkata",
}

const c = {
  card: "#ffffff",
  border: "#f0ebe4",
  bg: "#fffbf5",
  label: earth[600] || "#5a4f47",
  muted: earth[400],
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: c.card,
        border: `1px solid ${c.border}`,
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <Icon size={18} color={primary[500]} />
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: "1rem",
            fontWeight: 600,
            color: primary[900] || primary[500],
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: c.label,
          fontFamily: fonts.body,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: `1px solid ${c.border}`,
  borderRadius: "8px",
  fontFamily: fonts.body,
  fontSize: "0.875rem",
  color: earth[700] || "#3d3229",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [storeId, setStoreId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwSaving, setPwSaving] = useState(false)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminFetch<{
          stores: Array<{ id: string; name: string; metadata?: Record<string, unknown> }>
        }>("/admin/stores")
        const store = res.stores?.[0]
        if (store) {
          setStoreId(store.id)
          const meta = (store.metadata || {}) as Record<string, string>
          setSettings({
            name: store.name || DEFAULT_SETTINGS.name,
            supportEmail: meta.support_email || DEFAULT_SETTINGS.supportEmail,
            supportPhone: meta.support_phone || DEFAULT_SETTINGS.supportPhone,
            defaultCurrency: meta.default_currency || DEFAULT_SETTINGS.defaultCurrency,
            timezone: meta.timezone || DEFAULT_SETTINGS.timezone,
          })
        }
      } catch {
        // use defaults
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!storeId) return
    setIsSaving(true)
    try {
      await adminFetch(`/admin/stores/${storeId}`, {
        method: "POST",
        body: {
          name: settings.name,
          metadata: {
            support_email: settings.supportEmail,
            support_phone: settings.supportPhone,
            default_currency: settings.defaultCurrency,
            timezone: settings.timezone,
          },
        },
      })
      showToast("Settings saved successfully")
    } catch {
      showToast("Failed to save settings", false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast("Passwords don't match", false)
      return
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", false)
      return
    }
    setPwSaving(true)
    try {
      await adminFetch("/admin/users/me/password", {
        method: "POST",
        body: { old_password: currentPassword, new_password: newPassword },
      })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showToast("Password changed successfully")
    } catch {
      showToast("Failed to change password — check your current password", false)
    } finally {
      setPwSaving(false)
    }
  }

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
        <RefreshCw
          size={24}
          color={primary[400] || primary[500]}
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "720px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "1.5rem",
            fontWeight: 700,
            color: primary[900] || primary[500],
            margin: "0 0 6px",
          }}
        >
          Admin Settings
        </h1>
        <p style={{ color: c.muted, fontSize: "0.875rem", fontFamily: fonts.body, margin: 0 }}>
          Configure store information and admin account preferences
        </p>
      </div>

      {/* Store Details */}
      <Section title="Store Details" icon={Store}>
        <Field label="Store Name">
          <input
            style={inputStyle}
            value={settings.name}
            onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))}
            placeholder="VastuCart"
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Support Email">
            <div style={{ position: "relative" }}>
              <Mail
                size={15}
                color={c.muted}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                style={{ ...inputStyle, paddingLeft: "32px" }}
                value={settings.supportEmail}
                onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
                placeholder="support@vastucart.in"
                type="email"
              />
            </div>
          </Field>
          <Field label="Support Phone">
            <div style={{ position: "relative" }}>
              <Phone
                size={15}
                color={c.muted}
                style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
              />
              <input
                style={{ ...inputStyle, paddingLeft: "32px" }}
                value={settings.supportPhone}
                onChange={(e) => setSettings((s) => ({ ...s, supportPhone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="Default Currency">
            <ThemeSelect
              value={settings.defaultCurrency}
              onChange={(v) => setSettings((s) => ({ ...s, defaultCurrency: v }))}
              options={CURRENCY_OPTIONS}
            />
          </Field>
          <Field label="Timezone">
            <ThemeSelect
              value={settings.timezone}
              onChange={(v) => setSettings((s) => ({ ...s, timezone: v }))}
              options={TIMEZONE_OPTIONS}
            />
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              background: primary[500],
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            <Save size={15} />
            {isSaving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Admin Password" icon={Key}>
        <Field label="Current Password">
          <input
            style={inputStyle}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <Field label="New Password">
            <input
              style={inputStyle}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </Field>
          <Field label="Confirm New Password">
            <input
              style={inputStyle}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </Field>
        </div>
        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <p style={{ color: semantic.error, fontSize: "0.8125rem", fontFamily: fonts.body, marginTop: "-8px", marginBottom: "12px" }}>
            Passwords don&apos;t match
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !currentPassword || !newPassword || newPassword !== confirmPassword}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              background: primary[500],
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: (pwSaving || !currentPassword || !newPassword || newPassword !== confirmPassword) ? "not-allowed" : "pointer",
              opacity: (pwSaving || !currentPassword || !newPassword || newPassword !== confirmPassword) ? 0.6 : 1,
            }}
          >
            <Key size={15} />
            {pwSaving ? "Changing…" : "Change Password"}
          </button>
        </div>
      </Section>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            background: toast.ok ? primary[500] : semantic.error,
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            fontWeight: 600,
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
            zIndex: 9999,
            maxWidth: "320px",
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
