"use client"

import { useState } from "react"
import {
  BarChart2,
  Eye,
  ShoppingBag,
  MessageCircle,
  Headphones,
  Plug,
  CheckCircle2,
  Circle,
  RefreshCw,
  Globe,
  FileText,
  Map,
  Share2,
  Tag,
  Plus,
  Trash2,
  Save,
  Search,
  Image as ImageIcon,
  AlertCircle,
  Copy,
  ExternalLink,
  Zap,
  XCircle,
} from "lucide-react"
import { ThemeSelect } from "@/components/ui/ThemeSelect"
import type {
  AdminIntegrationsProps,
  IntegrationTab,
  Integration,
  IntegrationStatus,
  SEODefaults,
  OpenGraphDefaults,
  MarketingTag,
  GmcStatusResponse,
  MetaStatusResponse,
  GA4ReportResponse,
} from "@/types/admin-integrations"

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow:
    "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

const iconMap: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  "bar-chart-2": BarChart2,
  eye: Eye,
  "shopping-bag": ShoppingBag,
  "message-circle": MessageCircle,
  headphones: Headphones,
}

function statusColor(s: IntegrationStatus) {
  return s === "active" ? c.success : s === "error" ? c.error : c.earth300
}
function statusLabel(s: IntegrationStatus) {
  return s === "active" ? "Active" : s === "error" ? "Error" : "Inactive"
}
function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/* ─── Tab Bar ─── */
function TabBar({
  active,
  onChange,
}: {
  active: IntegrationTab
  onChange: (t: IntegrationTab) => void
}) {
  const tabs: { id: IntegrationTab; label: string; icon: React.ReactNode }[] =
    [
      { id: "integrations", label: "Integrations", icon: <Plug size={16} /> },
      { id: "seo", label: "SEO Settings", icon: <Search size={16} /> },
    ]
  return (
    <div
      className="flex gap-1 p-1 rounded-lg mb-6"
      style={{ backgroundColor: c.primary50 }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center"
          style={{
            fontFamily: fonts.body,
            backgroundColor: active === t.id ? c.card : "transparent",
            color: active === t.id ? c.primary500 : c.earth500,
            boxShadow: active === t.id ? c.shadow : "none",
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

/* ─── Integration Card ─── */
function IntegrationCard({
  integration,
  onToggle,
  onTest,
  onSaveConfig,
}: {
  integration: Integration
  onToggle?: () => Promise<void> | void
  onTest?: () => Promise<void> | void
  onSaveConfig?: (fields: Record<string, string>) => Promise<void> | void
}) {
  const [expanded, setExpanded] = useState(false)
  const [fields, setFields] = useState(integration.configFields)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<
    "success" | "error" | null
  >(null)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)
  const Icon = iconMap[integration.icon] || Plug

  // Sync local fields when integration prop changes (after parent re-renders)
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      await onTest?.()
      // Status is determined by hook validation — reflect in local UI
      setTestResult(
        integration.status === "error" ? "error" : "success"
      )
    } catch {
      setTestResult("error")
    } finally {
      setTesting(false)
      setTimeout(() => setTestResult(null), 3000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveConfig?.(fields)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async () => {
    setToggling(true)
    try {
      await onToggle?.()
    } finally {
      setToggling(false)
    }
  }

  // Sensitive field names — show as password inputs
  const sensitiveKeys = new Set([
    "conversionApiToken",
    "apiKey",
    "apiSecret",
    "accessToken",
  ])

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="h-1" style={{ background: c.gradient }} />
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: c.primary50 }}
            >
              <Icon size={20} style={{ color: c.primary500 }} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ fontFamily: fonts.heading, color: c.earth700 }}
              >
                {integration.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Circle
                  size={8}
                  fill={statusColor(integration.status)}
                  style={{ color: statusColor(integration.status) }}
                />
                <span
                  className="text-xs"
                  style={{
                    color: statusColor(integration.status),
                    fontFamily: fonts.body,
                  }}
                >
                  {statusLabel(integration.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Connected toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{
              backgroundColor: integration.isConnected
                ? c.success
                : c.earth300,
              opacity: toggling ? 0.6 : 1,
            }}
            title={integration.isConnected ? "Connected" : "Disconnected"}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
              style={{
                transform: integration.isConnected
                  ? "translateX(24px)"
                  : "translateX(4px)",
              }}
            />
          </button>
        </div>

        <p
          className="text-xs mb-3 leading-relaxed"
          style={{ color: c.earth500, fontFamily: fonts.body }}
        >
          {integration.description}
        </p>

        {integration.lastSynced && (
          <p
            className="text-xs mb-3"
            style={{ color: c.earth400, fontFamily: fonts.body }}
          >
            <RefreshCw
              size={11}
              className="inline mr-1"
              style={{ verticalAlign: "-1px" }}
            />
            Last synced: {formatDate(integration.lastSynced)}
          </p>
        )}

        {/* Config toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium"
          style={{ color: c.primary500, fontFamily: fonts.body }}
        >
          {expanded ? "Hide Configuration ↑" : "Show Configuration ↓"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {Object.entries(fields).map(([key, val]) => (
              <div key={key}>
                <label
                  className="block text-xs mb-1 capitalize"
                  style={{ color: c.earth500, fontFamily: fonts.body }}
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                  {sensitiveKeys.has(key) && (
                    <span
                      className="ml-1 text-xs"
                      style={{ color: c.earth300 }}
                    >
                      (secret)
                    </span>
                  )}
                </label>
                <input
                  type={sensitiveKeys.has(key) ? "password" : "text"}
                  value={val}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-md text-xs border outline-none"
                  style={{
                    fontFamily: fonts.mono,
                    borderColor: c.primary100,
                    color: c.earth700,
                    backgroundColor: c.bg,
                  }}
                />
              </div>
            ))}

            {/* Test result feedback */}
            {testResult && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
                style={{
                  backgroundColor:
                    testResult === "success" ? c.successLight : c.errorLight,
                  color:
                    testResult === "success" ? c.success : c.error,
                  fontFamily: fonts.body,
                }}
              >
                {testResult === "success" ? (
                  <CheckCircle2 size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {testResult === "success"
                  ? "Connection looks valid"
                  : "Check your credentials and try again"}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
                style={{
                  backgroundColor: c.primary500,
                  fontFamily: fonts.body,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Save size={12} />
                )}
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border"
                style={{
                  borderColor: c.primary500,
                  color: c.primary500,
                  fontFamily: fonts.body,
                  opacity: testing ? 0.7 : 1,
                }}
              >
                {testing ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                {testing ? "Testing…" : "Test Connection"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── SEO Settings Panel ─── */
function SEOSettingsPanel({
  seo,
  openGraph,
  marketingTags,
  onSaveSEO,
  onSaveOG,
  onToggleTag,
  onAddTag,
  onRemoveTag,
}: {
  seo: SEODefaults
  openGraph: OpenGraphDefaults
  marketingTags: MarketingTag[]
  onSaveSEO?: (s: SEODefaults) => Promise<void>
  onSaveOG?: (og: OpenGraphDefaults) => Promise<void>
  onToggleTag?: (id: string) => Promise<void>
  onAddTag?: (tag: Omit<MarketingTag, "id">) => Promise<void>
  onRemoveTag?: (id: string) => Promise<void>
}) {
  const [seoState, setSeo] = useState(seo)
  const [ogState, setOG] = useState(openGraph)
  const [savingSEO, setSavingSEO] = useState(false)
  const [savingOG, setSavingOG] = useState(false)
  const [savingRobots, setSavingRobots] = useState(false)

  // Add tag form state
  const [newTag, setNewTag] = useState({
    name: "",
    platform: "Google",
    pixelId: "",
  })
  const [addingTag, setAddingTag] = useState(false)

  const metaLen = seoState.metaDescription.length
  const metaColor =
    metaLen > 160 ? c.error : metaLen >= 150 ? c.warning : c.success

  const sectionCard = (
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode
  ) => (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="h-1" style={{ background: c.gradient }} />
      <div className="p-5">
        <h3
          className="flex items-center gap-2 text-base font-semibold mb-4"
          style={{ fontFamily: fonts.heading, color: c.earth700 }}
        >
          {icon} {title}
        </h3>
        {children}
      </div>
    </div>
  )

  const handleSaveMeta = async () => {
    setSavingSEO(true)
    try {
      await onSaveSEO?.(seoState)
    } finally {
      setSavingSEO(false)
    }
  }

  const handleSaveRobots = async () => {
    setSavingRobots(true)
    try {
      await onSaveSEO?.(seoState)
    } finally {
      setSavingRobots(false)
    }
  }

  const handleSaveOG = async () => {
    setSavingOG(true)
    try {
      await onSaveOG?.(ogState)
    } finally {
      setSavingOG(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTag.name.trim() || !newTag.pixelId.trim()) return
    setAddingTag(true)
    try {
      await onAddTag?.({ ...newTag, isActive: true })
      setNewTag({ name: "", platform: "Google", pixelId: "" })
    } finally {
      setAddingTag(false)
    }
  }

  return (
    <div>
      {/* Title & Meta */}
      {sectionCard(
        "Title & Meta",
        <Globe size={18} style={{ color: c.primary500 }} />,
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Site Title Template{" "}
              <span className="font-normal">(use %s for page title)</span>
            </label>
            <input
              type="text"
              value={seoState.siteTitleTemplate}
              onChange={(e) =>
                setSeo((prev) => ({
                  ...prev,
                  siteTitleTemplate: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.mono,
                backgroundColor: c.bg,
              }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: c.earth400, fontFamily: fonts.body }}
            >
              Preview:{" "}
              <span style={{ color: c.primary500 }}>
                {seoState.siteTitleTemplate.replace("%s", "Brass Diya Set")}
              </span>
            </p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-1">
              <label
                className="block text-xs font-medium"
                style={{ color: c.earth500, fontFamily: fonts.body }}
              >
                Default Meta Description
              </label>
              <span
                className="text-xs"
                style={{ color: metaColor, fontFamily: fonts.mono }}
              >
                {metaLen}/160
              </span>
            </div>
            <textarea
              value={seoState.metaDescription}
              onChange={(e) =>
                setSeo((prev) => ({
                  ...prev,
                  metaDescription: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm border outline-none resize-none"
              style={{
                borderColor:
                  metaLen > 160 ? c.error : c.primary100,
                color: c.earth700,
                fontFamily: fonts.body,
                backgroundColor: c.bg,
              }}
            />
          </div>

          <button
            onClick={handleSaveMeta}
            disabled={savingSEO}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{
              backgroundColor: c.primary500,
              fontFamily: fonts.body,
              opacity: savingSEO ? 0.7 : 1,
            }}
          >
            {savingSEO ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savingSEO ? "Saving…" : "Save Meta Settings"}
          </button>
        </div>
      )}

      {/* Robots & Sitemap */}
      {sectionCard(
        "Robots & Sitemap",
        <FileText size={18} style={{ color: c.primary500 }} />,
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              robots.txt
            </label>
            <textarea
              value={seoState.robotsTxt}
              onChange={(e) =>
                setSeo((prev) => ({ ...prev, robotsTxt: e.target.value }))
              }
              rows={8}
              placeholder={"User-agent: *\nAllow: /"}
              className="w-full px-3 py-2 rounded-md text-xs border outline-none resize-none leading-relaxed"
              style={{
                borderColor: c.primary100,
                fontFamily: fonts.mono,
                color: "#e5e5e5",
                backgroundColor: "#1e1e2e",
              }}
            />
            <p
              className="text-xs mt-1"
              style={{ color: c.earth300, fontFamily: fonts.body }}
            >
              Served at /robots.txt — changes take effect within 1 hour (CDN cache).
            </p>
          </div>

          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ backgroundColor: c.primary50 }}
          >
            <div className="flex items-center gap-3">
              <Map size={16} style={{ color: c.primary500 }} />
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: c.earth700, fontFamily: fonts.body }}
                >
                  XML Sitemap Auto-Generation
                </p>
                <p
                  className="text-xs"
                  style={{ color: c.earth400, fontFamily: fonts.body }}
                >
                  {seoState.sitemapEnabled
                    ? `Enabled — last saved ${
                        seoState.sitemapLastGenerated
                          ? formatDate(seoState.sitemapLastGenerated)
                          : "never"
                      }`
                    : "Disabled — /sitemap.xml returns empty"}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setSeo((prev) => ({
                  ...prev,
                  sitemapEnabled: !prev.sitemapEnabled,
                }))
              }
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{
                backgroundColor: seoState.sitemapEnabled
                  ? c.success
                  : c.earth300,
              }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: seoState.sitemapEnabled
                    ? "translateX(24px)"
                    : "translateX(4px)",
                }}
              />
            </button>
          </div>

          <button
            onClick={handleSaveRobots}
            disabled={savingRobots}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{
              backgroundColor: c.primary500,
              fontFamily: fonts.body,
              opacity: savingRobots ? 0.7 : 1,
            }}
          >
            {savingRobots ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savingRobots ? "Saving…" : "Save Robots & Sitemap"}
          </button>
        </div>
      )}

      {/* Open Graph & Social */}
      {sectionCard(
        "Open Graph & Social",
        <Share2 size={18} style={{ color: c.primary500 }} />,
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Default OG Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ogState.defaultImage}
                onChange={(e) =>
                  setOG((prev) => ({
                    ...prev,
                    defaultImage: e.target.value,
                  }))
                }
                className="flex-1 px-3 py-2 rounded-md text-sm border outline-none"
                style={{
                  borderColor: c.primary100,
                  color: c.earth700,
                  fontFamily: fonts.mono,
                  backgroundColor: c.bg,
                }}
                placeholder="https://yourdomain.com/og-image.jpg"
              />
              <div
                className="w-16 h-10 rounded-md flex items-center justify-center border"
                style={{
                  borderColor: c.primary100,
                  backgroundColor: c.primary50,
                }}
              >
                <ImageIcon size={16} style={{ color: c.primary400 }} />
              </div>
            </div>
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Default OG Title
            </label>
            <input
              type="text"
              value={ogState.defaultTitle}
              onChange={(e) =>
                setOG((prev) => ({ ...prev, defaultTitle: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.body,
                backgroundColor: c.bg,
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Default OG Description
            </label>
            <textarea
              value={ogState.defaultDescription}
              onChange={(e) =>
                setOG((prev) => ({
                  ...prev,
                  defaultDescription: e.target.value,
                }))
              }
              rows={2}
              className="w-full px-3 py-2 rounded-md text-sm border outline-none resize-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.body,
                backgroundColor: c.bg,
              }}
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: c.earth500, fontFamily: fonts.body }}
            >
              Twitter / X Handle
            </label>
            <input
              type="text"
              value={ogState.twitterHandle}
              onChange={(e) =>
                setOG((prev) => ({
                  ...prev,
                  twitterHandle: e.target.value,
                }))
              }
              className="w-full px-3 py-2 rounded-md text-sm border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.mono,
                backgroundColor: c.bg,
              }}
              placeholder="@handle"
            />
          </div>

          <button
            onClick={handleSaveOG}
            disabled={savingOG}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-white"
            style={{
              backgroundColor: c.primary500,
              fontFamily: fonts.body,
              opacity: savingOG ? 0.7 : 1,
            }}
          >
            {savingOG ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {savingOG ? "Saving…" : "Save Social Settings"}
          </button>
        </div>
      )}

      {/* Marketing Tags */}
      {sectionCard(
        "Marketing & Performance Tags",
        <Tag size={18} style={{ color: c.primary500 }} />,
        <div className="space-y-3">
          {marketingTags.length === 0 && (
            <p
              className="text-sm text-center py-4"
              style={{ color: c.earth400, fontFamily: fonts.body }}
            >
              No marketing tags added. Add tracking pixels to measure ad
              performance.
            </p>
          )}

          {marketingTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 rounded-lg border"
              style={{ borderColor: c.primary100, backgroundColor: c.bg }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      tag.platform === "Google"
                        ? c.primary50
                        : tag.platform === "Meta"
                        ? c.secondary50
                        : "#f0f0f0",
                    color:
                      tag.platform === "Google"
                        ? c.primary500
                        : tag.platform === "Meta"
                        ? c.secondary500
                        : c.earth500,
                    fontFamily: fonts.body,
                  }}
                >
                  {tag.platform}
                </span>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: c.earth700, fontFamily: fonts.body }}
                  >
                    {tag.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: c.earth400, fontFamily: fonts.mono }}
                  >
                    {tag.pixelId}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleTag?.(tag.id)}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{
                    backgroundColor: tag.isActive ? c.success : c.earth300,
                  }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform"
                    style={{
                      transform: tag.isActive
                        ? "translateX(18px)"
                        : "translateX(3px)",
                    }}
                  />
                </button>
                <button
                  onClick={() => onRemoveTag?.(tag.id)}
                  className="p-1 rounded"
                  style={{ color: c.error }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Tag Form */}
          <div
            className="flex flex-wrap gap-2 p-3 rounded-lg border-2 border-dashed"
            style={{ borderColor: c.primary100 }}
          >
            <input
              type="text"
              value={newTag.name}
              onChange={(e) =>
                setNewTag((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Tag name"
              className="flex-1 min-w-32 px-3 py-1.5 rounded-md text-xs border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.body,
                backgroundColor: c.bg,
              }}
            />
            <ThemeSelect
              value={newTag.platform}
              onChange={(v) => setNewTag((prev) => ({ ...prev, platform: v }))}
              options={[
                { value: "Google", label: "Google" },
                { value: "Meta", label: "Meta" },
                { value: "TikTok", label: "TikTok" },
                { value: "Pinterest", label: "Pinterest" },
                { value: "Other", label: "Other" },
              ]}
              size="sm"
            />
            <input
              type="text"
              value={newTag.pixelId}
              onChange={(e) =>
                setNewTag((prev) => ({ ...prev, pixelId: e.target.value }))
              }
              placeholder="Pixel / Tag ID"
              className="flex-1 min-w-32 px-3 py-1.5 rounded-md text-xs border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.mono,
                backgroundColor: c.bg,
              }}
            />
            <button
              onClick={handleAddTag}
              disabled={
                addingTag ||
                !newTag.name.trim() ||
                !newTag.pixelId.trim()
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{
                backgroundColor: c.primary500,
                fontFamily: fonts.body,
                opacity:
                  addingTag ||
                  !newTag.name.trim() ||
                  !newTag.pixelId.trim()
                    ? 0.5
                    : 1,
              }}
            >
              {addingTag ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Plus size={12} />
              )}
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── GMC Status Panel ─── */
function GmcStatusPanel({
  gmcStatus,
  onSync,
}: {
  gmcStatus: GmcStatusResponse | null | undefined
  onSync?: () => Promise<void>
}) {
  const [syncing, setSyncing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync?.()
    } finally {
      setSyncing(false)
    }
  }

  const handleCopy = () => {
    if (gmcStatus?.feedUrl) {
      navigator.clipboard?.writeText(gmcStatus.feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!gmcStatus) return null

  const { syncStatus, errorReport, feedUrl, isConfigured } = gmcStatus
  const statusColor =
    syncStatus?.status === "success"
      ? c.success
      : syncStatus?.status === "error"
      ? c.error
      : syncStatus?.status === "syncing"
      ? c.warning
      : c.earth300

  const statusLabel =
    syncStatus?.status === "success"
      ? "Synced"
      : syncStatus?.status === "error"
      ? "Sync Error"
      : syncStatus?.status === "syncing"
      ? "Syncing…"
      : "Not synced"

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="h-1" style={{ background: c.gradient }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="flex items-center gap-2 text-base font-semibold"
            style={{ fontFamily: fonts.heading, color: c.earth700 }}
          >
            <ShoppingBag size={18} style={{ color: c.primary500 }} />
            Google Merchant Centre Status
          </h3>
          {isConfigured && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{
                backgroundColor: c.primary500,
                fontFamily: fonts.body,
                opacity: syncing ? 0.7 : 1,
              }}
            >
              {syncing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              {syncing ? "Syncing…" : "Sync Now"}
            </button>
          )}
        </div>

        {!isConfigured ? (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: c.primary50 }}
          >
            <AlertCircle size={16} style={{ color: c.warning }} />
            <p className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
              GMC not configured. Enter your Merchant ID and optionally a Service Account Key in the GMC integration card above, then toggle it on.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sync status bar */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: c.primary50 }}
            >
              <div className="flex items-center gap-3">
                <Circle size={10} fill={statusColor} style={{ color: statusColor }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: c.earth700, fontFamily: fonts.body }}>
                    {statusLabel}
                  </p>
                  {syncStatus?.lastSync && (
                    <p className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
                      Last sync: {new Date(syncStatus.lastSync).toLocaleString("en-IN")}
                      {syncStatus.lastSyncProducts
                        ? ` — ${syncStatus.lastSyncProducts} variants`
                        : ""}
                      {syncStatus.lastSyncErrors
                        ? `, ${syncStatus.lastSyncErrors} errors`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              {syncStatus?.lastSyncErrors != null && syncStatus.lastSyncErrors > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: c.errorLight, color: c.error, fontFamily: fonts.body }}
                >
                  {syncStatus.lastSyncErrors} errors
                </span>
              )}
            </div>

            {/* Feed URL */}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: c.earth500, fontFamily: fonts.body }}
              >
                XML Feed URL — paste into Google Merchant Centre
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md border"
                style={{ borderColor: c.primary100, backgroundColor: c.bg }}
              >
                <span
                  className="flex-1 text-xs truncate"
                  style={{ fontFamily: fonts.mono, color: c.earth600 }}
                >
                  {feedUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1 rounded"
                  style={{ color: copied ? c.success : c.primary500 }}
                  title="Copy URL"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 rounded"
                  style={{ color: c.primary500 }}
                  title="Open feed"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Sync errors from last run */}
            {syncStatus?.errors && syncStatus.errors.length > 0 && (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.error, fontFamily: fonts.body }}
                >
                  Last Sync Errors
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {syncStatus.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-1.5 rounded text-xs"
                      style={{ backgroundColor: c.errorLight, color: c.error, fontFamily: fonts.body }}
                    >
                      <XCircle size={12} className="mt-0.5 shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error monitor report */}
            {errorReport && errorReport.disapprovedCount > 0 && (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.error, fontFamily: fonts.body }}
                >
                  Disapproved Products in GMC ({errorReport.disapprovedCount} of {errorReport.totalProducts})
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {errorReport.disapproved.slice(0, 10).map((item) => (
                    <div
                      key={item.productId}
                      className="px-3 py-2 rounded-lg border"
                      style={{ borderColor: "#fecaca", backgroundColor: c.errorLight }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: c.earth700, fontFamily: fonts.body }}
                      >
                        {item.title}
                      </p>
                      {item.issues.map((issue, j) => (
                        <p
                          key={j}
                          className="text-xs"
                          style={{ color: c.error, fontFamily: fonts.body }}
                        >
                          • {issue}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: c.earth300, fontFamily: fonts.body }}
                >
                  Checked {new Date(errorReport.checkedAt).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            {errorReport && errorReport.disapprovedCount === 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: c.successLight }}
              >
                <CheckCircle2 size={14} style={{ color: c.success }} />
                <p className="text-xs" style={{ color: c.success, fontFamily: fonts.body }}>
                  All {errorReport.totalProducts} products healthy in GMC — no disapprovals.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Meta Status Panel ─── */
function MetaStatusPanel({
  metaStatus,
  onSync,
}: {
  metaStatus: MetaStatusResponse | null | undefined
  onSync?: () => Promise<void>
}) {
  const [syncing, setSyncing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSync = async () => {
    setSyncing(true)
    try {
      await onSync?.()
    } finally {
      setSyncing(false)
    }
  }

  const handleCopy = () => {
    if (metaStatus?.feedUrl) {
      navigator.clipboard?.writeText(metaStatus.feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!metaStatus) return null

  const { syncStatus, errorReport, feedUrl, isConfigured } = metaStatus
  const statusColor =
    syncStatus?.status === "success"
      ? c.success
      : syncStatus?.status === "error"
      ? c.error
      : syncStatus?.status === "syncing"
      ? c.warning
      : c.earth300

  const statusLabel =
    syncStatus?.status === "success"
      ? "Synced"
      : syncStatus?.status === "error"
      ? "Sync Error"
      : syncStatus?.status === "syncing"
      ? "Syncing\u2026"
      : "Not synced"

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="h-1" style={{ background: "linear-gradient(90deg, #1877F2, #E1306C, #c85103)" }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="flex items-center gap-2 text-base font-semibold"
            style={{ fontFamily: fonts.heading, color: c.earth700 }}
          >
            <Share2 size={18} style={{ color: "#1877F2" }} />
            Meta Commerce Catalogue Status
          </h3>
          {isConfigured && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{
                backgroundColor: "#1877F2",
                fontFamily: fonts.body,
                opacity: syncing ? 0.7 : 1,
              }}
            >
              {syncing ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Zap size={12} />
              )}
              {syncing ? "Syncing\u2026" : "Sync Now"}
            </button>
          )}
        </div>

        {!isConfigured ? (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: c.primary50 }}
          >
            <AlertCircle size={16} style={{ color: c.warning }} />
            <p className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
              Meta Catalogue not configured. Enter your Catalog ID and System User Access Token in the Meta integration card above, then toggle it on.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sync status bar */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: c.primary50 }}
            >
              <div className="flex items-center gap-3">
                <Circle size={10} fill={statusColor} style={{ color: statusColor }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: c.earth700, fontFamily: fonts.body }}>
                    {statusLabel}
                  </p>
                  {syncStatus?.lastSync && (
                    <p className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
                      Last sync: {new Date(syncStatus.lastSync).toLocaleString("en-IN")}
                      {syncStatus.lastSyncProducts
                        ? ` \u2014 ${syncStatus.lastSyncProducts} variants`
                        : ""}
                      {syncStatus.lastSyncErrors
                        ? `, ${syncStatus.lastSyncErrors} errors`
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              {syncStatus?.lastSyncErrors != null && syncStatus.lastSyncErrors > 0 && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: c.errorLight, color: c.error, fontFamily: fonts.body }}
                >
                  {syncStatus.lastSyncErrors} errors
                </span>
              )}
            </div>

            {/* TSV Feed URL */}
            <div>
              <p
                className="text-xs font-medium mb-1"
                style={{ color: c.earth500, fontFamily: fonts.body }}
              >
                TSV Feed URL — add as a scheduled data source in Meta Commerce Manager
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md border"
                style={{ borderColor: c.primary100, backgroundColor: c.bg }}
              >
                <span
                  className="flex-1 text-xs truncate"
                  style={{ fontFamily: fonts.mono, color: c.earth600 }}
                >
                  {feedUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1 rounded"
                  style={{ color: copied ? c.success : "#1877F2" }}
                  title="Copy URL"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
                <a
                  href={feedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1 rounded"
                  style={{ color: "#1877F2" }}
                  title="Open feed"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Sync errors from last run */}
            {syncStatus?.errors && syncStatus.errors.length > 0 && (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.error, fontFamily: fonts.body }}
                >
                  Last Sync Errors
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {syncStatus.errors.map((err, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-1.5 rounded text-xs"
                      style={{ backgroundColor: c.errorLight, color: c.error, fontFamily: fonts.body }}
                    >
                      <XCircle size={12} className="mt-0.5 shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Catalogue diagnostics report */}
            {errorReport && errorReport.errorCount > 0 && (
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.error, fontFamily: fonts.body }}
                >
                  Catalogue Issues ({errorReport.errorCount} items affected)
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {errorReport.warnings.slice(0, 10).map((item) => (
                    <div
                      key={item.productId}
                      className="px-3 py-2 rounded-lg border"
                      style={{ borderColor: "#fecaca", backgroundColor: c.errorLight }}
                    >
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: c.earth700, fontFamily: fonts.body }}
                      >
                        {item.title}
                      </p>
                      {item.issues.map((issue, j) => (
                        <p
                          key={j}
                          className="text-xs"
                          style={{ color: c.error, fontFamily: fonts.body }}
                        >
                          &bull; {issue}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{ color: c.earth300, fontFamily: fonts.body }}
                >
                  Checked {new Date(errorReport.checkedAt).toLocaleString("en-IN")}
                </p>
              </div>
            )}

            {errorReport && errorReport.errorCount === 0 && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ backgroundColor: c.successLight }}
              >
                <CheckCircle2 size={14} style={{ color: c.success }} />
                <p className="text-xs" style={{ color: c.success, fontFamily: fonts.body }}>
                  All {errorReport.totalItems} catalogue items healthy in Meta &mdash; no issues detected.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── GA4 Analytics Panel ─── */
function Ga4AnalyticsPanel({
  ga4Report,
  onFetch,
}: {
  ga4Report: GA4ReportResponse | null | undefined
  onFetch?: (days?: number) => Promise<void>
}) {
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(30)

  const handleFetch = async (d = days) => {
    setLoading(true)
    try {
      await onFetch?.(d)
    } finally {
      setLoading(false)
    }
  }

  const totalSessions = ga4Report?.report?.totals.sessions ?? 0
  const deviceTotal = (ga4Report?.report?.deviceBreakdown || []).reduce(
    (s, d) => s + d.sessions,
    0
  )

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{ backgroundColor: c.card, boxShadow: c.shadow }}
    >
      <div className="h-1" style={{ background: "linear-gradient(90deg, #E37400, #FBBC05, #34A853, #4285F4)" }} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3
            className="flex items-center gap-2 text-base font-semibold"
            style={{ fontFamily: fonts.heading, color: c.earth700 }}
          >
            <BarChart2 size={18} style={{ color: "#4285F4" }} />
            Google Analytics 4 — Last {days} Days
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={days}
              onChange={(e) => {
                const d = parseInt(e.target.value, 10)
                setDays(d)
                handleFetch(d)
              }}
              className="px-2 py-1 rounded-md text-xs border outline-none"
              style={{
                borderColor: c.primary100,
                color: c.earth700,
                fontFamily: fonts.body,
                backgroundColor: c.bg,
              }}
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
            <button
              onClick={() => handleFetch()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white"
              style={{
                backgroundColor: "#4285F4",
                fontFamily: fonts.body,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {!ga4Report ? (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: c.primary50 }}
          >
            <AlertCircle size={16} style={{ color: c.warning }} />
            <p className="text-sm" style={{ color: c.earth600, fontFamily: fonts.body }}>
              Click Refresh to load your GA4 analytics data.
            </p>
          </div>
        ) : !ga4Report.isConfigured ? (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: c.primary50 }}
          >
            <AlertCircle size={16} style={{ color: c.warning }} />
            <div>
              <p className="text-sm font-medium" style={{ color: c.earth700, fontFamily: fonts.body }}>
                GA4 Data API not configured
              </p>
              <p className="text-xs mt-0.5" style={{ color: c.earth500, fontFamily: fonts.body }}>
                Enter your Measurement ID, Property ID (numeric), and Service Account Key in the GA4 integration card above, then save and toggle on.
              </p>
            </div>
          </div>
        ) : ga4Report.error ? (
          <div
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: c.errorLight }}
          >
            <AlertCircle size={16} style={{ color: c.error }} />
            <div>
              <p className="text-sm font-medium" style={{ color: c.error, fontFamily: fonts.body }}>
                GA4 API Error
              </p>
              <p className="text-xs mt-0.5" style={{ color: c.earth600, fontFamily: fonts.mono }}>
                {ga4Report.error}
              </p>
            </div>
          </div>
        ) : ga4Report.report ? (
          <div className="space-y-5">
            {/* Date range */}
            <p className="text-xs" style={{ color: c.earth400, fontFamily: fonts.body }}>
              {new Date(ga4Report.report.dateRange.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(ga4Report.report.dateRange.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" · "}
              {ga4Report.report.propertyId}
            </p>

            {/* Totals grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Sessions", value: ga4Report.report.totals.sessions, color: "#4285F4" },
                { label: "Users", value: ga4Report.report.totals.users, color: "#34A853" },
                { label: "Page Views", value: ga4Report.report.totals.pageviews, color: "#FBBC05" },
                { label: "Events", value: ga4Report.report.totals.eventCount, color: "#E37400" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-lg p-3 text-center"
                  style={{ backgroundColor: c.primary50 }}
                >
                  <p
                    className="text-xl font-semibold"
                    style={{ color, fontFamily: fonts.heading }}
                  >
                    {value.toLocaleString("en-IN")}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: c.earth500, fontFamily: fonts.body }}
                  >
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Top pages + device breakdown side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top pages */}
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.earth500, fontFamily: fonts.body }}
                >
                  Top Pages by Sessions
                </p>
                <div className="space-y-1.5">
                  {(ga4Report.report.topPages || []).slice(0, 8).map((p, i) => {
                    const pct = totalSessions > 0 ? (p.sessions / totalSessions) * 100 : 0
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs truncate max-w-[160px]"
                            style={{ color: c.earth700, fontFamily: fonts.mono }}
                            title={p.page}
                          >
                            {p.page}
                          </span>
                          <span
                            className="text-xs ml-2 shrink-0"
                            style={{ color: c.earth500, fontFamily: fonts.body }}
                          >
                            {p.sessions.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: c.primary100 }}
                        >
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: "#4285F4",
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {ga4Report.report.topPages.length === 0 && (
                    <p className="text-xs" style={{ color: c.earth300, fontFamily: fonts.body }}>
                      No page data available
                    </p>
                  )}
                </div>
              </div>

              {/* Device breakdown */}
              <div>
                <p
                  className="text-xs font-medium mb-2"
                  style={{ color: c.earth500, fontFamily: fonts.body }}
                >
                  Device Breakdown
                </p>
                <div className="space-y-1.5">
                  {(ga4Report.report.deviceBreakdown || []).map((d, i) => {
                    const pct = deviceTotal > 0 ? (d.sessions / deviceTotal) * 100 : 0
                    const devColors: Record<string, string> = {
                      mobile: "#34A853",
                      desktop: "#4285F4",
                      tablet: "#FBBC05",
                    }
                    const clr = devColors[d.device.toLowerCase()] || c.earth300
                    return (
                      <div key={i} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs capitalize"
                            style={{ color: c.earth700, fontFamily: fonts.body }}
                          >
                            {d.device}
                          </span>
                          <span
                            className="text-xs ml-2"
                            style={{ color: c.earth500, fontFamily: fonts.body }}
                          >
                            {pct.toFixed(1)}% ({d.sessions.toLocaleString("en-IN")})
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full"
                          style={{ backgroundColor: c.primary100 }}
                        >
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, pct)}%`,
                              backgroundColor: clr,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {ga4Report.report.deviceBreakdown.length === 0 && (
                    <p className="text-xs" style={{ color: c.earth300, fontFamily: fonts.body }}>
                      No device data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ─── Main Component ─── */
export function AdminIntegrations({
  activeTab: initialTab,
  integrations,
  seoDefaults,
  openGraph,
  marketingTags,
  gmcStatus,
  metaStatus,
  ga4Report,
  onChangeTab,
  onToggleConnection,
  onTestConnection,
  onSaveIntegrationConfig,
  onSaveSEO,
  onSaveOpenGraph,
  onToggleTag,
  onAddTag,
  onRemoveTag,
  onGmcSync,
  onMetaSync,
  onFetchGa4Report,
}: AdminIntegrationsProps) {
  const [tab, setTab] = useState<IntegrationTab>(initialTab)

  const handleTabChange = (t: IntegrationTab) => {
    setTab(t)
    onChangeTab?.(t)
  }

  const activeCount = integrations.filter((i) => i.status === "active").length
  const errorCount = integrations.filter((i) => i.status === "error").length
  const inactiveCount = integrations.filter(
    (i) => i.status === "inactive"
  ).length

  return (
    <div style={{ fontFamily: fonts.body }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl md:text-3xl font-semibold mb-1"
            style={{ fontFamily: fonts.heading, color: c.earth700 }}
          >
            Integrations & SEO
          </h1>
          <p
            className="text-sm"
            style={{ color: c.earth500, fontFamily: fonts.body }}
          >
            Manage third-party connections, analytics, and search engine
            settings.
          </p>
        </div>

        {/* Tabs */}
        <TabBar active={tab} onChange={handleTabChange} />

        {/* Integrations Tab */}
        {tab === "integrations" && (
          <div>
            {/* Summary bar */}
            <div className="flex flex-wrap gap-3 mb-6">
              {[
                {
                  status: "active" as const,
                  count: activeCount,
                  color: c.success,
                },
                {
                  status: "error" as const,
                  count: errorCount,
                  color: c.error,
                },
                {
                  status: "inactive" as const,
                  count: inactiveCount,
                  color: c.earth300,
                },
              ].map(({ status, count, color }) => (
                <div
                  key={status}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: c.card, boxShadow: c.shadow }}
                >
                  <Circle size={8} fill={color} style={{ color }} />
                  <span
                    className="text-xs font-medium"
                    style={{ color: c.earth600, fontFamily: fonts.body }}
                  >
                    {count} {statusLabel(status)}
                  </span>
                </div>
              ))}
            </div>

            {/* GMC Status Panel — shown when GMC card exists */}
            {integrations.some((i) => i.id === "gmc") && (
              <GmcStatusPanel gmcStatus={gmcStatus} onSync={onGmcSync} />
            )}

            {/* Meta Status Panel — shown when Meta card exists */}
            {integrations.some((i) => i.id === "meta") && (
              <MetaStatusPanel metaStatus={metaStatus} onSync={onMetaSync} />
            )}

            {/* GA4 Analytics Panel — shown when GA4 card exists */}
            {integrations.some((i) => i.id === "ga4") && (
              <Ga4AnalyticsPanel ga4Report={ga4Report} onFetch={onFetchGa4Report} />
            )}

          {/* Card grid */}
            {integrations.length === 0 ? (
              <div
                className="rounded-xl p-12 text-center"
                style={{ backgroundColor: c.card, boxShadow: c.shadow }}
              >
                <Plug
                  size={40}
                  style={{ color: c.earth300, margin: "0 auto 12px" }}
                />
                <p
                  className="text-sm"
                  style={{ color: c.earth400, fontFamily: fonts.body }}
                >
                  No integrations connected yet. Set up tracking and marketing
                  tools.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {integrations.map((integ) => (
                  <IntegrationCard
                    key={integ.id}
                    integration={integ}
                    onToggle={() => onToggleConnection?.(integ.id)}
                    onTest={() => onTestConnection?.(integ.id)}
                    onSaveConfig={(f) =>
                      onSaveIntegrationConfig?.(integ.id, f)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEO Tab */}
        {tab === "seo" && (
          <SEOSettingsPanel
            seo={seoDefaults}
            openGraph={openGraph}
            marketingTags={marketingTags}
            onSaveSEO={onSaveSEO}
            onSaveOG={onSaveOpenGraph}
            onToggleTag={onToggleTag}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
          />
        )}
      </div>
    </div>
  )
}
