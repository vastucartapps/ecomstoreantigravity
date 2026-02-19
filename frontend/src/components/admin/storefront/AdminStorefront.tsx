"use client"

import { useState } from "react"
import {
  Save,
  Upload,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Store,
  Layout,
  FileText,
  Info,
  Loader2,
  Calendar,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react"
import {
  primary,
  secondary,
  earth,
  bg,
  fonts,
  shadows,
  semantic,
} from "@/lib/theme"
import type {
  AdminStorefrontProps,
  Announcement,
  Branding,
  HomepageSection,
  ContentPage,
  FooterConfig,
  FooterColumn,
  FooterLink,
} from "@/types/admin-storefront"

type ActiveTab = "announcement" | "branding" | "homepage" | "content" | "footer"

const cardStyle: React.CSSProperties = {
  background: `linear-gradient(#ffffff, #ffffff) padding-box, linear-gradient(90deg, ${primary[500]}, #2a7a72, ${secondary[500]}) border-box`,
  borderTop: "4px solid transparent",
  borderRadius: "12px",
  padding: "32px",
  boxShadow: shadows.card,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: `1px solid ${earth[300]}`,
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: fonts.body,
  outline: "none",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: earth[700],
  marginBottom: "8px",
}

const saveBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 20px",
  background: primary[500],
  color: "#ffffff",
  border: "none",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 200ms",
}

// ─── Inline field editor (for footer link/column) ─────────────────────────
interface InlineEditProps {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  mono?: boolean
}

function InlineEdit({ value, onSave, placeholder, mono }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
          color: earth[700],
          fontFamily: mono ? fonts.mono : fonts.body,
          minWidth: 0,
        }}
      >
        <span style={{ flex: 1, wordBreak: "break-all" }}>{value || <em style={{ color: earth[300] }}>{placeholder}</em>}</span>
        <button
          onClick={() => { setDraft(value); setEditing(true) }}
          style={{ color: primary[400], background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: "2px" }}
          title="Edit"
        >
          <Pencil size={13} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { onSave(draft); setEditing(false) }
          if (e.key === "Escape") setEditing(false)
        }}
        style={{
          ...inputStyle,
          padding: "5px 8px",
          fontFamily: mono ? fonts.mono : fonts.body,
          fontSize: "13px",
        }}
      />
      <button
        onClick={() => { onSave(draft); setEditing(false) }}
        style={{ color: semantic.success, background: "none", border: "none", cursor: "pointer", padding: "2px" }}
      >
        <Check size={14} />
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{ color: earth[400], background: "none", border: "none", cursor: "pointer", padding: "2px" }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Footer CRUD ──────────────────────────────────────────────────────────
interface FooterEditorProps {
  footer: FooterConfig
  onChange: (f: FooterConfig) => void
}

function FooterEditor({ footer, onChange }: FooterEditorProps) {
  function updateColumnTitle(colIdx: number, title: string) {
    const columns = footer.columns.map((c, i) =>
      i === colIdx ? { ...c, title } : c
    )
    onChange({ ...footer, columns })
  }

  function updateLink(colIdx: number, linkIdx: number, field: keyof FooterLink, value: string) {
    const columns = footer.columns.map((c, i) => {
      if (i !== colIdx) return c
      const links = c.links.map((l, j) =>
        j === linkIdx ? { ...l, [field]: value } : l
      )
      return { ...c, links }
    })
    onChange({ ...footer, columns })
  }

  function addLink(colIdx: number) {
    const columns = footer.columns.map((c, i) =>
      i === colIdx
        ? { ...c, links: [...c.links, { label: "New Link", url: "/" }] }
        : c
    )
    onChange({ ...footer, columns })
  }

  function removeLink(colIdx: number, linkIdx: number) {
    const columns = footer.columns.map((c, i) => {
      if (i !== colIdx) return c
      return { ...c, links: c.links.filter((_, j) => j !== linkIdx) }
    })
    onChange({ ...footer, columns })
  }

  function addColumn() {
    onChange({
      ...footer,
      columns: [
        ...footer.columns,
        { title: "New Column", links: [{ label: "Link", url: "/" }] },
      ],
    })
  }

  function removeColumn(colIdx: number) {
    onChange({ ...footer, columns: footer.columns.filter((_, i) => i !== colIdx) })
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))`,
          gap: "20px",
          marginBottom: "16px",
        }}
      >
        {footer.columns.map((col, colIdx) => (
          <div
            key={colIdx}
            style={{
              padding: "20px",
              background: bg.subtle,
              borderRadius: "8px",
              border: `1px solid #e8ddd4`,
            }}
          >
            {/* Column title */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <InlineEdit
                value={col.title}
                onSave={(v) => updateColumnTitle(colIdx, v)}
                placeholder="Column title"
              />
              <button
                onClick={() => removeColumn(colIdx)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: semantic.error,
                  padding: "2px",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
                title="Remove column"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Links */}
            <div style={{ display: "grid", gap: "10px" }}>
              {col.links.map((link, linkIdx) => (
                <div
                  key={linkIdx}
                  style={{
                    background: "#ffffff",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    border: `1px solid #e8ddd4`,
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    <InlineEdit
                      value={link.label}
                      onSave={(v) => updateLink(colIdx, linkIdx, "label", v)}
                      placeholder="Link label"
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <InlineEdit
                      value={link.url}
                      onSave={(v) => updateLink(colIdx, linkIdx, "url", v)}
                      placeholder="/path"
                      mono
                    />
                    <button
                      onClick={() => removeLink(colIdx, linkIdx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: earth[300],
                        padding: "2px",
                        flexShrink: 0,
                      }}
                      title="Remove link"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add link */}
            <button
              onClick={() => addLink(colIdx)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "12px",
                background: "none",
                border: `1px dashed ${primary[200]}`,
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                color: primary[500],
                cursor: "pointer",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Plus size={13} /> Add Link
            </button>
          </div>
        ))}
      </div>

      {/* Add column */}
      <button
        onClick={addColumn}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: `1px dashed ${primary[200]}`,
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          color: primary[500],
          cursor: "pointer",
          marginBottom: "24px",
        }}
      >
        <Plus size={15} /> Add Column
      </button>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────

export function AdminStorefront({
  announcement: initialAnnouncement,
  branding: initialBranding,
  homepageSections: initialSections,
  contentPages,
  footerConfig: initialFooter,
  onUpdateAnnouncement,
  onUpdateBranding,
  onReorderSection,
  onToggleSection,
  onEditPage,
  onTogglePagePublish,
  onUpdateFooter,
}: AdminStorefrontProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("announcement")

  // Local form state
  const [announcement, setAnnouncement] = useState<Announcement>(initialAnnouncement)
  const [branding, setBranding] = useState<Branding>(initialBranding)
  const [sections, setSections] = useState<HomepageSection[]>(initialSections)
  const [footer, setFooter] = useState<FooterConfig>(initialFooter)

  // Content page editor
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [pageContent, setPageContent] = useState("")

  // Loading states
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [savingFooter, setSavingFooter] = useState(false)
  const [savingPage, setSavingPage] = useState(false)
  const [togglingSection, setTogglingSection] = useState<string | null>(null)
  const [reorderingSection, setReorderingSection] = useState<string | null>(null)
  const [togglingPage, setTogglingPage] = useState<string | null>(null)

  const tabs: { key: ActiveTab; label: string; Icon: typeof Megaphone }[] = [
    { key: "announcement", label: "Announcement", Icon: Megaphone },
    { key: "branding", label: "Branding", Icon: Store },
    { key: "homepage", label: "Homepage Sections", Icon: Layout },
    { key: "content", label: "Content Pages", Icon: FileText },
    { key: "footer", label: "Footer", Icon: Info },
  ]

  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  async function handleSaveAnnouncement() {
    setSavingAnnouncement(true)
    try {
      await onUpdateAnnouncement(announcement)
    } finally {
      setSavingAnnouncement(false)
    }
  }

  async function handleSaveBranding() {
    setSavingBranding(true)
    try {
      await onUpdateBranding(branding)
    } finally {
      setSavingBranding(false)
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    setReorderingSection(id)
    try {
      await onReorderSection(id, direction)
      setSections((prev) => {
        const sorted = [...prev].sort((a, b) => a.order - b.order)
        const idx = sorted.findIndex((s) => s.id === id)
        const swapIdx = direction === "up" ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev
        const aOrder = sorted[idx].order
        const bOrder = sorted[swapIdx].order
        return prev.map((s) => {
          if (s.id === sorted[idx].id) return { ...s, order: bOrder }
          if (s.id === sorted[swapIdx].id) return { ...s, order: aOrder }
          return s
        })
      })
    } finally {
      setReorderingSection(null)
    }
  }

  async function handleToggleSection(id: string, enabled: boolean) {
    setTogglingSection(id)
    try {
      await onToggleSection(id, enabled)
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      )
    } finally {
      setTogglingSection(null)
    }
  }

  async function handleSavePage() {
    if (!editingPageId) return
    setSavingPage(true)
    try {
      await onEditPage(editingPageId, pageContent)
      setEditingPageId(null)
      setPageContent("")
    } finally {
      setSavingPage(false)
    }
  }

  async function handleTogglePublish(pageId: string, currentlyPublished: boolean) {
    setTogglingPage(pageId)
    try {
      await onTogglePagePublish(pageId, !currentlyPublished)
    } finally {
      setTogglingPage(null)
    }
  }

  async function handleSaveFooter() {
    setSavingFooter(true)
    try {
      await onUpdateFooter(footer)
    } finally {
      setSavingFooter(false)
    }
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "32px",
          borderBottom: `2px solid #f5dfbb`,
          overflowX: "auto",
        }}
      >
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 20px",
              background: activeTab === key ? primary[50] : "transparent",
              color: activeTab === key ? primary[500] : earth[600],
              border: "none",
              borderBottom:
                activeTab === key
                  ? `3px solid ${primary[500]}`
                  : "3px solid transparent",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: fonts.body,
              cursor: "pointer",
              transition: "all 200ms",
              marginBottom: "-2px",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== key) e.currentTarget.style.background = "#f5dfbb"
            }}
            onMouseLeave={(e) => {
              if (activeTab !== key) e.currentTarget.style.background = "transparent"
            }}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Announcement Tab ── */}
      {activeTab === "announcement" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: "0 0 24px 0",
            }}
          >
            Announcement Ribbon
          </h2>

          {/* Active toggle */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={announcement.isActive}
                onChange={(e) =>
                  setAnnouncement({ ...announcement, isActive: e.target.checked })
                }
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "15px", fontWeight: 600, color: earth[700] }}>
                Active
              </span>
            </label>
          </div>

          <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
            {/* Message */}
            <div>
              <label style={labelStyle}>Message</label>
              <input
                type="text"
                value={announcement.message}
                onChange={(e) =>
                  setAnnouncement({ ...announcement, message: e.target.value })
                }
                placeholder="Free shipping on orders above ₹999!"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>

            {/* Link Text + URL */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Link Text</label>
                <input
                  type="text"
                  value={announcement.linkText}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, linkText: e.target.value })
                  }
                  placeholder="Shop Now"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label style={labelStyle}>Link URL</label>
                <input
                  type="text"
                  value={announcement.linkUrl}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, linkUrl: e.target.value })
                  }
                  placeholder="/collections/best-sellers"
                  style={{ ...inputStyle, fontFamily: fonts.mono }}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            {/* Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Background Color</label>
                <input
                  type="color"
                  value={announcement.bgColor}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, bgColor: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "4px",
                    border: `1px solid ${earth[300]}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Text Color</label>
                <input
                  type="color"
                  value={announcement.textColor}
                  onChange={(e) =>
                    setAnnouncement({ ...announcement, textColor: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "42px",
                    padding: "4px",
                    border: `1px solid ${earth[300]}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            {/* Schedule */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={14} /> Start Date
                </label>
                <input
                  type="date"
                  value={announcement.schedule.startDate}
                  onChange={(e) =>
                    setAnnouncement({
                      ...announcement,
                      schedule: { ...announcement.schedule, startDate: e.target.value },
                    })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label
                  style={{
                    ...labelStyle,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Calendar size={14} /> End Date
                </label>
                <input
                  type="date"
                  value={announcement.schedule.endDate}
                  onChange={(e) =>
                    setAnnouncement({
                      ...announcement,
                      schedule: { ...announcement.schedule, endDate: e.target.value },
                    })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label style={labelStyle}>Preview</label>
              <div
                style={{
                  padding: "12px 20px",
                  background: announcement.bgColor,
                  color: announcement.textColor,
                  borderRadius: "8px",
                  textAlign: "center",
                  fontSize: "14px",
                  fontFamily: fonts.body,
                }}
              >
                {announcement.message}{" "}
                {announcement.linkText && (
                  <span
                    style={{
                      textDecoration: "underline",
                      fontWeight: 600,
                      color: announcement.textColor,
                    }}
                  >
                    {announcement.linkText}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveAnnouncement}
            disabled={savingAnnouncement}
            style={{
              ...saveBtnStyle,
              opacity: savingAnnouncement ? 0.7 : 1,
              cursor: savingAnnouncement ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!savingAnnouncement) e.currentTarget.style.background = primary[400]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = primary[500]
            }}
          >
            {savingAnnouncement ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Announcement
          </button>
        </div>
      )}

      {/* ── Branding Tab ── */}
      {activeTab === "branding" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: "0 0 24px 0",
            }}
          >
            Store Branding
          </h2>

          <div style={{ display: "grid", gap: "20px", marginBottom: "24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Store Name</label>
                <input
                  type="text"
                  value={branding.storeName}
                  onChange={(e) => setBranding({ ...branding, storeName: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label style={labelStyle}>Tagline</label>
                <input
                  type="text"
                  value={branding.tagline}
                  onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Contact Email</label>
                <input
                  type="email"
                  value={branding.contactEmail}
                  onChange={(e) => setBranding({ ...branding, contactEmail: e.target.value })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input
                  type="tel"
                  value={branding.contactPhone}
                  onChange={(e) =>
                    setBranding({ ...branding, contactPhone: e.target.value })
                  }
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Address</label>
              <textarea
                value={branding.address}
                onChange={(e) => setBranding({ ...branding, address: e.target.value })}
                style={{
                  ...inputStyle,
                  minHeight: "60px",
                  resize: "vertical",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>

            {/* Logo + Favicon */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Logo URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={branding.logoUrl}
                    onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                    placeholder="/images/logo.png"
                    style={{ ...inputStyle, flex: 1, fontFamily: fonts.mono }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                  <button
                    style={{
                      padding: "10px 14px",
                      background: bg.subtle,
                      border: `1px solid ${earth[300]}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: earth[700],
                      whiteSpace: "nowrap",
                    }}
                    title="Upload logo (paste URL above for now)"
                  >
                    <Upload size={14} /> Upload
                  </button>
                </div>
                {branding.logoUrl && (
                  <div style={{ marginTop: "8px" }}>
                    <img
                      src={branding.logoUrl}
                      alt="Logo preview"
                      style={{ height: "40px", objectFit: "contain", borderRadius: "4px" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>Favicon URL</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={branding.faviconUrl}
                    onChange={(e) => setBranding({ ...branding, faviconUrl: e.target.value })}
                    placeholder="/favicon.ico"
                    style={{ ...inputStyle, flex: 1, fontFamily: fonts.mono }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                  <button
                    style={{
                      padding: "10px 14px",
                      background: bg.subtle,
                      border: `1px solid ${earth[300]}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: earth[700],
                      whiteSpace: "nowrap",
                    }}
                    title="Upload favicon (paste URL above for now)"
                  >
                    <Upload size={14} /> Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveBranding}
            disabled={savingBranding}
            style={{
              ...saveBtnStyle,
              opacity: savingBranding ? 0.7 : 1,
              cursor: savingBranding ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!savingBranding) e.currentTarget.style.background = primary[400]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = primary[500]
            }}
          >
            {savingBranding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Branding
          </button>
        </div>
      )}

      {/* ── Homepage Sections Tab ── */}
      {activeTab === "homepage" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: "0 0 8px 0",
            }}
          >
            Homepage Sections
          </h2>
          <p style={{ fontSize: "14px", color: earth[400], margin: "0 0 24px 0" }}>
            Reorder and toggle visibility of homepage sections. Changes take effect
            immediately on the storefront.
          </p>

          <div style={{ display: "grid", gap: "12px" }}>
            {sortedSections.map((section, idx) => (
              <div
                key={section.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: section.enabled ? bg.subtle : "#ffffff",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "8px",
                  opacity:
                    reorderingSection === section.id || togglingSection === section.id
                      ? 0.6
                      : 1,
                  transition: "opacity 200ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: earth[400],
                      fontFamily: fonts.mono,
                      minWidth: "24px",
                    }}
                  >
                    {section.order}
                  </span>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: section.enabled ? earth[700] : earth[400],
                    }}
                  >
                    {section.name}
                  </span>
                  {!section.enabled && (
                    <span
                      style={{
                        fontSize: "12px",
                        background: "#f5dfbb",
                        color: earth[500],
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontWeight: 600,
                      }}
                    >
                      Hidden
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Up/Down */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => handleReorder(section.id, "up")}
                      disabled={idx === 0}
                      style={{
                        padding: "6px",
                        background: idx === 0 ? earth[300] : "#ffffff",
                        border: `1px solid ${earth[300]}`,
                        borderRadius: "6px",
                        cursor: idx === 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        color: idx === 0 ? earth[300] : earth[600],
                      }}
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleReorder(section.id, "down")}
                      disabled={idx === sortedSections.length - 1}
                      style={{
                        padding: "6px",
                        background:
                          idx === sortedSections.length - 1 ? earth[300] : "#ffffff",
                        border: `1px solid ${earth[300]}`,
                        borderRadius: "6px",
                        cursor:
                          idx === sortedSections.length - 1 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        color:
                          idx === sortedSections.length - 1 ? earth[300] : earth[600],
                      }}
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  {/* Toggle switch */}
                  <label
                    style={{
                      position: "relative",
                      display: "inline-block",
                      width: "52px",
                      height: "28px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => handleToggleSection(section.id, !section.enabled)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: section.enabled ? primary[500] : earth[300],
                        borderRadius: "28px",
                        transition: "all 200ms",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          height: "22px",
                          width: "22px",
                          left: section.enabled ? "27px" : "3px",
                          bottom: "3px",
                          background: "#ffffff",
                          borderRadius: "50%",
                          transition: "all 200ms",
                        }}
                      />
                    </span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Content Pages Tab ── */}
      {activeTab === "content" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: "0 0 24px 0",
            }}
          >
            Content Pages
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: bg.subtle }}>
                  {["Title", "Slug", "Last Updated", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: "14px 16px",
                          textAlign: "left",
                          fontSize: "13px",
                          fontWeight: 700,
                          color: earth[700],
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {contentPages.map((page: ContentPage, idx: number) => (
                  <tr
                    key={page.id}
                    style={{
                      borderTop: idx === 0 ? "none" : `1px solid #f5dfbb`,
                      background: "#ffffff",
                    }}
                  >
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: earth[700],
                      }}
                    >
                      {page.title}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "13px",
                        color: earth[500],
                        fontFamily: fonts.mono,
                      }}
                    >
                      /{page.slug}
                    </td>
                    <td
                      style={{
                        padding: "16px",
                        fontSize: "14px",
                        color: earth[500],
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(page.lastUpdated).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: page.isPublished ? "#D1FAE5" : "#FEF3C7",
                          color: page.isPublished ? semantic.success : "#D97706",
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {page.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td style={{ padding: "16px" }}>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          onClick={() => {
                            setEditingPageId(page.id)
                            setPageContent(page.content || page.excerpt || "")
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "transparent",
                            color: primary[500],
                            border: `1px solid ${primary[500]}`,
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublish(page.id, page.isPublished)}
                          disabled={togglingPage === page.id}
                          style={{
                            padding: "6px 12px",
                            background: page.isPublished ? "#FEE2E2" : "#D1FAE5",
                            color: page.isPublished ? semantic.error : semantic.success,
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: togglingPage === page.id ? "not-allowed" : "pointer",
                            opacity: togglingPage === page.id ? 0.6 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {togglingPage === page.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : null}
                          {page.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Page editor */}
          {editingPageId && (
            <div
              style={{
                marginTop: "24px",
                padding: "24px",
                background: primary[50],
                borderRadius: "8px",
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "18px",
                  fontWeight: 600,
                  color: earth[700],
                  margin: "0 0 8px 0",
                }}
              >
                Editing:{" "}
                {contentPages.find((p: ContentPage) => p.id === editingPageId)?.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: earth[400],
                  margin: "0 0 16px 0",
                }}
              >
                Markdown is supported: # Heading, ## Sub-heading, **bold**, *italic*,
                - list item
              </p>
              <textarea
                value={pageContent}
                onChange={(e) => setPageContent(e.target.value)}
                placeholder="Enter page content (markdown supported)..."
                style={{
                  width: "100%",
                  minHeight: "300px",
                  padding: "12px",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontFamily: fonts.mono,
                  lineHeight: 1.7,
                  resize: "vertical",
                  outline: "none",
                  marginBottom: "16px",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={handleSavePage}
                  disabled={savingPage}
                  style={{
                    ...saveBtnStyle,
                    opacity: savingPage ? 0.7 : 1,
                    cursor: savingPage ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!savingPage) e.currentTarget.style.background = primary[400]
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = primary[500]
                  }}
                >
                  {savingPage ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Content
                </button>
                <button
                  onClick={() => {
                    setEditingPageId(null)
                    setPageContent("")
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: earth[600],
                    border: `1px solid ${earth[300]}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer Tab ── */}
      {activeTab === "footer" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 600,
              color: earth[700],
              margin: "0 0 24px 0",
            }}
          >
            Footer Configuration
          </h2>

          <div style={{ marginBottom: "12px" }}>
            <h3
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: earth[700],
                margin: "0 0 16px 0",
              }}
            >
              Footer Columns
            </h3>
            <p style={{ fontSize: "13px", color: earth[400], margin: "0 0 20px 0" }}>
              Click the pencil icon to edit a column title or link. Use Trash to remove.
            </p>
            <FooterEditor footer={footer} onChange={setFooter} />
          </div>

          {/* Copyright */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Copyright Text</label>
            <input
              type="text"
              value={footer.copyrightText}
              onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = primary[400])}
              onBlur={(e) => (e.target.style.borderColor = earth[300])}
            />
          </div>

          {/* Social links toggle */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={footer.showSocialLinks}
                onChange={(e) =>
                  setFooter({ ...footer, showSocialLinks: e.target.checked })
                }
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "15px", fontWeight: 600, color: earth[700] }}>
                Show Social Links
              </span>
            </label>
          </div>

          <button
            onClick={handleSaveFooter}
            disabled={savingFooter}
            style={{
              ...saveBtnStyle,
              opacity: savingFooter ? 0.7 : 1,
              cursor: savingFooter ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!savingFooter) e.currentTarget.style.background = primary[400]
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = primary[500]
            }}
          >
            {savingFooter ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Footer
          </button>
        </div>
      )}
    </div>
  )
}
