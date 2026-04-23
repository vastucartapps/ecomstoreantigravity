"use client"

import { useState, useEffect, useRef } from "react"
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
  SlidersHorizontal,
  UserCircle,
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
  HeroSlide,
  MarketingSlide,
  AboutConfig,
  ContactConfig,
  ConsultationConfig,
  FaqItem,
} from "@/types/admin-storefront"
import { normalizeImageUrl } from "@/lib/image-url"

type ActiveTab = "announcement" | "branding" | "homepage" | "content" | "footer" | "hero" | "login-slides" | "about-contact" | "consultations"

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
  heroSlides: initialHeroSlides,
  marketingSlides: initialMarketingSlides,
  aboutConfig: initialAboutConfig,
  contactConfig: initialContactConfig,
  onUpdateAnnouncement,
  onUpdateBranding,
  onReorderSection,
  onToggleSection,
  onEditPage,
  onTogglePagePublish,
  onUpdateFooter,
  onCreateHeroSlide,
  onUpdateHeroSlide,
  onDeleteHeroSlide,
  onCreateMarketingSlide,
  onUpdateMarketingSlide,
  onDeleteMarketingSlide,
  onSaveAboutConfig,
  onSaveContactConfig,
  consultationConfig: initialConsultationConfig,
  onSaveConsultationConfig,
}: AdminStorefrontProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("announcement")

  // Local form state
  const [announcement, setAnnouncement] = useState<Announcement>(initialAnnouncement)
  const [branding, setBranding] = useState<Branding>(initialBranding)
  const [sections, setSections] = useState<HomepageSection[]>(initialSections)
  const [footer, setFooter] = useState<FooterConfig>(initialFooter)

  // Slides state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialHeroSlides)
  const [marketingSlides, setMarketingSlides] = useState<MarketingSlide[]>(initialMarketingSlides)

  // Hero slide form
  const [heroFormOpen, setHeroFormOpen] = useState(false)
  const [editingHeroId, setEditingHeroId] = useState<string | null>(null)
  const [heroForm, setHeroForm] = useState<Omit<HeroSlide, "id">>({ image_url: "", heading: "", subtext: "", cta_label: "Shop Now", cta_link: "/", is_active: true, display_order: 1 })
  const [savingHero, setSavingHero] = useState(false)

  // Marketing slide form
  const [mktFormOpen, setMktFormOpen] = useState(false)
  const [editingMktId, setEditingMktId] = useState<string | null>(null)
  const [mktForm, setMktForm] = useState<Omit<MarketingSlide, "id">>({ image_url: "", quote: "", attribution: "VastuCart", is_active: true, display_order: 1 })
  const [savingMkt, setSavingMkt] = useState(false)

  // Sync internal state when parent re-fetches config (e.g. on page reload or background refresh)
  useEffect(() => { setAnnouncement(initialAnnouncement) }, [initialAnnouncement])
  useEffect(() => { setBranding(initialBranding) }, [initialBranding])
  useEffect(() => { setSections(initialSections) }, [initialSections])
  useEffect(() => { setFooter(initialFooter) }, [initialFooter])
  useEffect(() => { setHeroSlides(initialHeroSlides) }, [initialHeroSlides])
  useEffect(() => { setMarketingSlides(initialMarketingSlides) }, [initialMarketingSlides])

  // About & Contact state
  const [aboutConfig, setAboutConfig] = useState<AboutConfig>(initialAboutConfig)
  const [contactConfig, setContactConfig] = useState<ContactConfig>(initialContactConfig)
  const [aboutSubTab, setAboutSubTab] = useState<"about" | "contact">("about")
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingContact, setSavingContact] = useState(false)

  // Consultation state
  const [consultationConfig, setConsultationConfig] = useState<ConsultationConfig>(initialConsultationConfig)
  const [savingConsultation, setSavingConsultation] = useState(false)

  useEffect(() => { setAboutConfig(initialAboutConfig) }, [initialAboutConfig])
  useEffect(() => { setContactConfig(initialContactConfig) }, [initialContactConfig])
  useEffect(() => { setConsultationConfig(initialConsultationConfig) }, [initialConsultationConfig])

  // Content page editor
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [pageContent, setPageContent] = useState("")

  const [uploadingGiftCard, setUploadingGiftCard] = useState(false)
  const giftCardFileRef = useRef<HTMLInputElement>(null)

  const handleGiftCardUpload = async (file: File) => {
    setUploadingGiftCard(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const token = typeof window !== "undefined" ? localStorage.getItem("vastucart_admin_token") : null
      const headers: HeadersInit = {}
      if (token) headers["Authorization"] = `Bearer ${token}`
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
      const res = await fetch(`${backendUrl}/admin/uploads`, { method: "POST", headers, credentials: "include", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      const url: string = data.files?.[0]?.url || ""
      if (url) setBranding({ ...branding, gift_card_image_url: url })
    } catch { /* silent */ } finally {
      setUploadingGiftCard(false)
    }
  }

  // Loading states
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [savingBranding, setSavingBranding] = useState(false)
  const [savingFooter, setSavingFooter] = useState(false)
  const [savingPage, setSavingPage] = useState(false)
  const [togglingSection, setTogglingSection] = useState<string | null>(null)
  const [reorderingSection, setReorderingSection] = useState<string | null>(null)
  const [togglingPage, setTogglingPage] = useState<string | null>(null)

  const tabs: { key: ActiveTab; label: string; Icon: typeof Megaphone }[] = [
    { key: "hero", label: "Hero Slides", Icon: SlidersHorizontal },
    { key: "login-slides", label: "Login Slides", Icon: UserCircle },
    { key: "announcement", label: "Announcement", Icon: Megaphone },
    { key: "branding", label: "Branding", Icon: Store },
    { key: "homepage", label: "Homepage Sections", Icon: Layout },
    { key: "content", label: "Content Pages", Icon: FileText },
    { key: "footer", label: "Footer", Icon: Info },
    { key: "about-contact", label: "About & Contact", Icon: Info },
    { key: "consultations", label: "Consultations", Icon: Calendar },
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

  async function handleSaveAbout() {
    setSavingAbout(true)
    try {
      await onSaveAboutConfig(aboutConfig)
    } finally {
      setSavingAbout(false)
    }
  }

  async function handleSaveContact() {
    setSavingContact(true)
    try {
      await onSaveContactConfig(contactConfig)
    } finally {
      setSavingContact(false)
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

      {/* ── Hero Slides Tab ── */}
      {activeTab === "hero" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: earth[700], margin: 0 }}>
                Hero Slides
              </h2>
              <p style={{ fontSize: "13px", color: earth[400], margin: "6px 0 0 0" }}>
                Full-width banner slides shown on the homepage. Each slide has an image, heading, subtext, and a CTA button.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingHeroId(null)
                setHeroForm({ image_url: "", heading: "", subtext: "", cta_label: "Shop Now", cta_link: "/", is_active: true, display_order: heroSlides.length + 1 })
                setHeroFormOpen(true)
              }}
              style={{ ...saveBtnStyle, gap: "6px" }}
            >
              <Plus size={16} /> Add Slide
            </button>
          </div>

          {/* Slide list */}
          {heroSlides.length === 0 && !heroFormOpen && (
            <div style={{ textAlign: "center", padding: "48px 0", color: earth[400], fontSize: "14px" }}>
              No hero slides yet. Add your first slide to display a banner on the homepage.
            </div>
          )}
          <div style={{ display: "grid", gap: "16px", marginBottom: heroFormOpen ? "24px" : 0 }}>
            {heroSlides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  display: "flex",
                  gap: "16px",
                  padding: "16px",
                  background: slide.is_active ? "#fafaf9" : "#f5f5f4",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "10px",
                  alignItems: "center",
                  opacity: slide.is_active ? 1 : 0.7,
                }}
              >
                {/* Image preview */}
                <div style={{ width: "120px", height: "70px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: earth[200], display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {slide.image_url ? (
                    <img
                      src={normalizeImageUrl(slide.image_url)}
                      alt={slide.heading}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  ) : (
                    <SlidersHorizontal size={24} style={{ color: earth[400] }} />
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: earth[700], margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slide.heading || <em style={{ color: earth[300] }}>No heading</em>}
                  </p>
                  <p style={{ fontSize: "13px", color: earth[500], margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {slide.subtext}
                  </p>
                  <p style={{ fontSize: "12px", color: earth[400], margin: 0, fontFamily: fonts.mono }}>
                    {slide.cta_label} → {slide.cta_link}
                  </p>
                </div>

                {/* Order badge */}
                <span style={{ fontSize: "12px", fontWeight: 700, color: earth[400], fontFamily: fonts.mono, flexShrink: 0 }}>#{slide.display_order}</span>

                {/* Active toggle */}
                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={slide.is_active}
                    onChange={async () => {
                      const updated = await onUpdateHeroSlide(slide.id, { is_active: !slide.is_active })
                      setHeroSlides((prev) => prev.map((s) => s.id === slide.id ? updated : s))
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: slide.is_active ? primary[500] : earth[300], borderRadius: "24px", transition: "all 200ms" }}>
                    <span style={{ position: "absolute", height: "18px", width: "18px", left: slide.is_active ? "23px" : "3px", bottom: "3px", background: "#fff", borderRadius: "50%", transition: "all 200ms" }} />
                  </span>
                </label>

                {/* Edit */}
                <button
                  onClick={() => {
                    setEditingHeroId(slide.id)
                    setHeroForm({ image_url: slide.image_url, heading: slide.heading, subtext: slide.subtext, cta_label: slide.cta_label, cta_link: slide.cta_link, is_active: slide.is_active, display_order: slide.display_order })
                    setHeroFormOpen(true)
                  }}
                  style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${primary[500]}`, borderRadius: "6px", color: primary[500], fontSize: "13px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                >
                  <Pencil size={13} style={{ display: "inline", marginRight: "4px" }} />Edit
                </button>

                {/* Delete */}
                <button
                  onClick={async () => {
                    if (!confirm("Delete this slide?")) return
                    await onDeleteHeroSlide(slide.id)
                    setHeroSlides((prev) => prev.filter((s) => s.id !== slide.id))
                  }}
                  style={{ padding: "6px 10px", background: "transparent", border: `1px solid #fca5a5`, borderRadius: "6px", color: "#ef4444", fontSize: "13px", cursor: "pointer", flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add/Edit form */}
          {heroFormOpen && (
            <div style={{ padding: "24px", background: primary[50], borderRadius: "10px", border: `1px solid ${primary[200]}` }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: "17px", fontWeight: 600, color: earth[700], margin: "0 0 20px 0" }}>
                {editingHeroId ? "Edit Slide" : "New Slide"}
              </h3>
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Image URL */}
                <div>
                  <label style={labelStyle}>Image URL</label>
                  <input
                    type="text"
                    value={heroForm.image_url}
                    onChange={(e) => setHeroForm({ ...heroForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... or https://sapi.vastucart.in/api/uploads/..."
                    style={{ ...inputStyle, fontFamily: fonts.mono }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                  {/* Live image preview */}
                  {heroForm.image_url && (
                    <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", height: "140px", background: earth[200] }}>
                      <img
                        src={normalizeImageUrl(heroForm.image_url)}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: earth[400], margin: "6px 0 0 0" }}>
                    Paste an image URL. Recommended size: 1400×500px. Use Unsplash, or upload via MinIO and paste the URL here.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Heading</label>
                    <input type="text" value={heroForm.heading} onChange={(e) => setHeroForm({ ...heroForm, heading: e.target.value })} placeholder="Discover Sacred Products" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                  <div>
                    <label style={labelStyle}>Display Order</label>
                    <input type="number" min={1} value={heroForm.display_order} onChange={(e) => setHeroForm({ ...heroForm, display_order: Number(e.target.value) })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Subtext</label>
                  <input type="text" value={heroForm.subtext} onChange={(e) => setHeroForm({ ...heroForm, subtext: e.target.value })} placeholder="Authentic crystals, yantras and spiritual wellness products" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>CTA Button Label</label>
                    <input type="text" value={heroForm.cta_label} onChange={(e) => setHeroForm({ ...heroForm, cta_label: e.target.value })} placeholder="Shop Now" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                  <div>
                    <label style={labelStyle}>CTA Link</label>
                    <input type="text" value={heroForm.cta_link} onChange={(e) => setHeroForm({ ...heroForm, cta_link: e.target.value })} placeholder="/collections/crystals" style={{ ...inputStyle, fontFamily: fonts.mono }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={heroForm.is_active} onChange={(e) => setHeroForm({ ...heroForm, is_active: e.target.checked })} style={{ width: "18px", height: "18px" }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Active (visible on homepage)</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button
                  disabled={savingHero}
                  onClick={async () => {
                    setSavingHero(true)
                    try {
                      if (editingHeroId) {
                        await onUpdateHeroSlide(editingHeroId, heroForm)
                        setHeroSlides((prev) => prev.map((s) => s.id === editingHeroId ? { ...s, ...heroForm } : s))
                      } else {
                        await onCreateHeroSlide(heroForm)
                      }
                      setHeroFormOpen(false)
                      setEditingHeroId(null)
                    } finally {
                      setSavingHero(false)
                    }
                  }}
                  style={{ ...saveBtnStyle, opacity: savingHero ? 0.7 : 1, cursor: savingHero ? "not-allowed" : "pointer" }}
                >
                  {savingHero ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingHeroId ? "Save Changes" : "Add Slide"}
                </button>
                <button onClick={() => { setHeroFormOpen(false); setEditingHeroId(null) }} style={{ padding: "10px 20px", background: "transparent", color: earth[600], border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Login Slides Tab ── */}
      {activeTab === "login-slides" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: earth[700], margin: 0 }}>
                Login Page Slides
              </h2>
              <p style={{ fontSize: "13px", color: earth[400], margin: "6px 0 0 0" }}>
                Inspirational slides shown on the right panel of the Login, Register and Forgot Password pages.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingMktId(null)
                setMktForm({ image_url: "", quote: "", attribution: "VastuCart", is_active: true, display_order: marketingSlides.length + 1 })
                setMktFormOpen(true)
              }}
              style={{ ...saveBtnStyle, gap: "6px" }}
            >
              <Plus size={16} /> Add Slide
            </button>
          </div>

          {/* Slide list */}
          {marketingSlides.length === 0 && !mktFormOpen && (
            <div style={{ textAlign: "center", padding: "48px 0", color: earth[400], fontSize: "14px" }}>
              No login slides yet. The login page will show default placeholder images until you add slides here.
            </div>
          )}
          <div style={{ display: "grid", gap: "16px", marginBottom: mktFormOpen ? "24px" : 0 }}>
            {marketingSlides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  display: "flex",
                  gap: "16px",
                  padding: "16px",
                  background: slide.is_active ? "#fafaf9" : "#f5f5f4",
                  border: `1px solid ${earth[300]}`,
                  borderRadius: "10px",
                  alignItems: "center",
                  opacity: slide.is_active ? 1 : 0.7,
                }}
              >
                {/* Image preview */}
                <div style={{ width: "100px", height: "70px", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: earth[200], display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {slide.image_url ? (
                    <img
                      src={normalizeImageUrl(slide.image_url)}
                      alt="Login slide"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  ) : (
                    <UserCircle size={24} style={{ color: earth[400] }} />
                  )}
                </div>

                {/* Quote */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontStyle: "italic", color: earth[700], margin: "0 0 4px 0", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    "{slide.quote || <em style={{ color: earth[300] }}>No quote</em>}"
                  </p>
                  <p style={{ fontSize: "12px", color: earth[400], margin: 0 }}>— {slide.attribution}</p>
                </div>

                <span style={{ fontSize: "12px", fontWeight: 700, color: earth[400], fontFamily: fonts.mono, flexShrink: 0 }}>#{slide.display_order}</span>

                {/* Active toggle */}
                <label style={{ position: "relative", display: "inline-block", width: "44px", height: "24px", cursor: "pointer", flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={slide.is_active}
                    onChange={async () => {
                      const updated = await onUpdateMarketingSlide(slide.id, { is_active: !slide.is_active })
                      setMarketingSlides((prev) => prev.map((s) => s.id === slide.id ? updated : s))
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: slide.is_active ? primary[500] : earth[300], borderRadius: "24px", transition: "all 200ms" }}>
                    <span style={{ position: "absolute", height: "18px", width: "18px", left: slide.is_active ? "23px" : "3px", bottom: "3px", background: "#fff", borderRadius: "50%", transition: "all 200ms" }} />
                  </span>
                </label>

                {/* Edit */}
                <button
                  onClick={() => {
                    setEditingMktId(slide.id)
                    setMktForm({ image_url: slide.image_url, quote: slide.quote, attribution: slide.attribution, is_active: slide.is_active, display_order: slide.display_order })
                    setMktFormOpen(true)
                  }}
                  style={{ padding: "6px 12px", background: "transparent", border: `1px solid ${primary[500]}`, borderRadius: "6px", color: primary[500], fontSize: "13px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}
                >
                  <Pencil size={13} style={{ display: "inline", marginRight: "4px" }} />Edit
                </button>

                {/* Delete */}
                <button
                  onClick={async () => {
                    if (!confirm("Delete this slide?")) return
                    await onDeleteMarketingSlide(slide.id)
                    setMarketingSlides((prev) => prev.filter((s) => s.id !== slide.id))
                  }}
                  style={{ padding: "6px 10px", background: "transparent", border: `1px solid #fca5a5`, borderRadius: "6px", color: "#ef4444", fontSize: "13px", cursor: "pointer", flexShrink: 0 }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Add/Edit form */}
          {mktFormOpen && (
            <div style={{ padding: "24px", background: primary[50], borderRadius: "10px", border: `1px solid ${primary[200]}` }}>
              <h3 style={{ fontFamily: fonts.heading, fontSize: "17px", fontWeight: 600, color: earth[700], margin: "0 0 20px 0" }}>
                {editingMktId ? "Edit Slide" : "New Login Slide"}
              </h3>
              <div style={{ display: "grid", gap: "16px" }}>
                {/* Image URL */}
                <div>
                  <label style={labelStyle}>Image URL</label>
                  <input
                    type="text"
                    value={mktForm.image_url}
                    onChange={(e) => setMktForm({ ...mktForm, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/... or MinIO URL"
                    style={{ ...inputStyle, fontFamily: fonts.mono }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                  {mktForm.image_url && (
                    <div style={{ marginTop: "8px", borderRadius: "8px", overflow: "hidden", height: "160px", background: earth[200] }}>
                      <img
                        src={normalizeImageUrl(mktForm.image_url)}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: earth[400], margin: "6px 0 0 0" }}>
                    Tall portrait-style images work best (e.g. 800×1200px). The image fills the right panel of the auth page.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Quote / Message</label>
                  <textarea
                    value={mktForm.quote}
                    onChange={(e) => setMktForm({ ...mktForm, quote: e.target.value })}
                    placeholder="Transform your space with the ancient wisdom of Vastu Shastra..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Attribution</label>
                    <input type="text" value={mktForm.attribution} onChange={(e) => setMktForm({ ...mktForm, attribution: e.target.value })} placeholder="VastuCart" style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                  <div>
                    <label style={labelStyle}>Display Order</label>
                    <input type="number" min={1} value={mktForm.display_order} onChange={(e) => setMktForm({ ...mktForm, display_order: Number(e.target.value) })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={mktForm.is_active} onChange={(e) => setMktForm({ ...mktForm, is_active: e.target.checked })} style={{ width: "18px", height: "18px" }} />
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Active (shown on login/register/forgot-password pages)</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
                <button
                  disabled={savingMkt}
                  onClick={async () => {
                    setSavingMkt(true)
                    try {
                      if (editingMktId) {
                        await onUpdateMarketingSlide(editingMktId, mktForm)
                        setMarketingSlides((prev) => prev.map((s) => s.id === editingMktId ? { ...s, ...mktForm } : s))
                      } else {
                        await onCreateMarketingSlide(mktForm)
                      }
                      setMktFormOpen(false)
                      setEditingMktId(null)
                    } finally {
                      setSavingMkt(false)
                    }
                  }}
                  style={{ ...saveBtnStyle, opacity: savingMkt ? 0.7 : 1, cursor: savingMkt ? "not-allowed" : "pointer" }}
                >
                  {savingMkt ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {editingMktId ? "Save Changes" : "Add Slide"}
                </button>
                <button onClick={() => { setMktFormOpen(false); setEditingMktId(null) }} style={{ padding: "10px 20px", background: "transparent", color: earth[600], border: `1px solid ${earth[300]}`, borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
              <label style={labelStyle}>Street Address</label>
              <textarea
                value={branding.streetAddress}
                onChange={(e) => setBranding({ ...branding, streetAddress: e.target.value })}
                placeholder="42 Temple Lane, Near Old Market"
                style={{
                  ...inputStyle,
                  minHeight: "60px",
                  resize: "vertical",
                }}
                onFocus={(e) => (e.target.style.borderColor = primary[400])}
                onBlur={(e) => (e.target.style.borderColor = earth[300])}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={branding.addressLocality}
                  onChange={(e) => setBranding({ ...branding, addressLocality: e.target.value })}
                  placeholder="Varanasi"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label style={labelStyle}>State / Region</label>
                <input
                  type="text"
                  value={branding.addressRegion}
                  onChange={(e) => setBranding({ ...branding, addressRegion: e.target.value })}
                  placeholder="Uttar Pradesh"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={labelStyle}>Postal Code</label>
                <input
                  type="text"
                  value={branding.postalCode}
                  onChange={(e) => setBranding({ ...branding, postalCode: e.target.value })}
                  placeholder="221001"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
              <div>
                <label style={labelStyle}>Country (ISO code)</label>
                <input
                  type="text"
                  value={branding.addressCountry}
                  onChange={(e) => setBranding({ ...branding, addressCountry: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="IN"
                  maxLength={2}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = primary[400])}
                  onBlur={(e) => (e.target.style.borderColor = earth[300])}
                />
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label style={{ ...labelStyle, marginBottom: "10px", display: "block" }}>
                Social Profile URLs
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {(["instagram", "facebook", "youtube", "twitter", "pinterest"] as const).map((platform) => (
                  <div key={platform}>
                    <label style={{ ...labelStyle, fontSize: "11px", textTransform: "capitalize" }}>
                      {platform}
                    </label>
                    <input
                      type="url"
                      value={(branding as any).socialLinks?.[platform] || ""}
                      onChange={(e) =>
                        setBranding({
                          ...branding,
                          socialLinks: { ...((branding as any).socialLinks || {}), [platform]: e.target.value },
                        })
                      }
                      placeholder={`https://${platform}.com/yourhandle`}
                      style={{ ...inputStyle, fontFamily: fonts.mono, fontSize: "12px" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                ))}
              </div>
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

          {/* Gift Card Image */}
          <div style={{ borderTop: `1px solid ${earth[200]}`, paddingTop: "20px", marginTop: "8px" }}>
            <h3 style={{ fontFamily: fonts.heading, fontSize: "15px", fontWeight: 600, color: earth[700], margin: "0 0 4px 0" }}>
              Gift Card Image
            </h3>
            <p style={{ fontSize: "12px", color: earth[400], margin: "0 0 12px 0" }}>
              Displayed on customers&apos; gift card in their account dashboard. Recommended: 800×400px.
            </p>
            {branding.gift_card_image_url ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={normalizeImageUrl(branding.gift_card_image_url)}
                  alt="Gift card"
                  style={{ height: 100, borderRadius: 12, objectFit: "cover", border: `1px solid ${earth[300]}` }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => giftCardFileRef.current?.click()}
                    disabled={uploadingGiftCard}
                    style={{
                      padding: "6px 12px", background: earth[100], border: `1px solid ${earth[300]}`,
                      borderRadius: 8, fontSize: 12, fontWeight: 600, color: earth[700], cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <Upload size={12} /> Replace
                  </button>
                  <button
                    onClick={() => setBranding({ ...branding, gift_card_image_url: "" })}
                    style={{
                      padding: "6px 12px", background: "#FEF2F2", border: "1px solid #FECACA",
                      borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => giftCardFileRef.current?.click()}
                disabled={uploadingGiftCard}
                style={{
                  width: 200, height: 100, border: `2px dashed ${earth[300]}`, borderRadius: 12,
                  background: earth[100], cursor: "pointer", display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6, color: earth[400],
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <Upload size={18} />
                {uploadingGiftCard ? "Uploading..." : "Upload Gift Card Image"}
              </button>
            )}
            <input
              ref={giftCardFileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleGiftCardUpload(file)
                e.target.value = ""
              }}
            />
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

      {/* ── About & Contact Panel ─────────────────────────────────────────── */}
      {activeTab === "about-contact" && (
        <div style={cardStyle}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: primary[900],
              marginBottom: "24px",
            }}
          >
            About & Contact Pages
          </h2>

          {/* Sub-tabs */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginBottom: "32px",
              borderBottom: `2px solid #f5dfbb`,
            }}
          >
            {(["about", "contact"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setAboutSubTab(st)}
                style={{
                  padding: "10px 20px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: aboutSubTab === st ? 700 : 500,
                  color: aboutSubTab === st ? primary[500] : earth[500],
                  borderBottom: aboutSubTab === st ? `3px solid ${primary[500]}` : "3px solid transparent",
                  marginBottom: "-2px",
                  transition: "all 150ms",
                  textTransform: "capitalize",
                  fontFamily: fonts.body,
                }}
              >
                {st === "about" ? "About Page" : "Contact Page"}
              </button>
            ))}
          </div>

          {/* ── About Sub-tab ─────────────────────────────────── */}
          {aboutSubTab === "about" && (
            <div style={{ display: "grid", gap: "24px" }}>

              {/* Hero */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Hero Section
                </h3>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Hero Tagline</label>
                    <input
                      type="text"
                      value={aboutConfig.heroTagline}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, heroTagline: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Hero Subtext</label>
                    <input
                      type="text"
                      value={aboutConfig.heroSubtext}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, heroSubtext: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Stats
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  {aboutConfig.stats.map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px",
                        background: "#f9f6f3",
                        borderRadius: "8px",
                        border: `1px solid #e8ddd4`,
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: "8px" }}>
                        <div>
                          <label style={{ ...labelStyle, fontSize: "12px" }}>Label</label>
                          <input
                            type="text"
                            value={stat.label}
                            onChange={(e) => {
                              const stats = aboutConfig.stats.map((s, j) => j === i ? { ...s, label: e.target.value } : s)
                              setAboutConfig({ ...aboutConfig, stats })
                            }}
                            style={{ ...inputStyle, padding: "7px 10px", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: "12px" }}>Value</label>
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => {
                              const stats = aboutConfig.stats.map((s, j) => j === i ? { ...s, value: e.target.value } : s)
                              setAboutConfig({ ...aboutConfig, stats })
                            }}
                            style={{ ...inputStyle, padding: "7px 10px", fontSize: "13px" }}
                          />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, fontSize: "12px" }}>Suffix</label>
                          <input
                            type="text"
                            value={stat.suffix}
                            onChange={(e) => {
                              const stats = aboutConfig.stats.map((s, j) => j === i ? { ...s, suffix: e.target.value } : s)
                              setAboutConfig({ ...aboutConfig, stats })
                            }}
                            style={{ ...inputStyle, padding: "7px 10px", fontSize: "13px" }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Brand Story
                </h3>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Story Title</label>
                    <input
                      type="text"
                      value={aboutConfig.storyTitle}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, storyTitle: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Story Text (use double newline for paragraphs)</label>
                    <textarea
                      value={aboutConfig.storyText}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, storyText: e.target.value })}
                      rows={6}
                      style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                </div>
              </div>

              {/* Founder */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Founder
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Founder Name</label>
                    <input
                      type="text"
                      value={aboutConfig.founderName}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, founderName: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Founder Role</label>
                    <input
                      type="text"
                      value={aboutConfig.founderRole}
                      onChange={(e) => setAboutConfig({ ...aboutConfig, founderRole: e.target.value })}
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label style={labelStyle}>Founder Bio</label>
                  <textarea
                    value={aboutConfig.founderBio}
                    onChange={(e) => setAboutConfig({ ...aboutConfig, founderBio: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                </div>
              </div>

              {/* Artisan Regions */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Artisan Regions
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                  {aboutConfig.artisanRegions.map((region, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 12px",
                        background: primary[50],
                        color: primary[500],
                        borderRadius: "9999px",
                        fontSize: "13px",
                        fontFamily: fonts.body,
                        fontWeight: 600,
                        border: `1px solid ${primary[100]}`,
                      }}
                    >
                      {region}
                      <button
                        onClick={() => setAboutConfig({ ...aboutConfig, artisanRegions: aboutConfig.artisanRegions.filter((_, j) => j !== i) })}
                        style={{ background: "none", border: "none", cursor: "pointer", color: earth[400], padding: "0", lineHeight: 1, fontSize: "14px" }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="new-region-input"
                    type="text"
                    placeholder="Add region (e.g. Agra)"
                    style={{ ...inputStyle, width: "240px" }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val && !aboutConfig.artisanRegions.includes(val)) {
                          setAboutConfig({ ...aboutConfig, artisanRegions: [...aboutConfig.artisanRegions, val] });
                          (e.target as HTMLInputElement).value = ""
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById("new-region-input") as HTMLInputElement
                      if (!input) return
                      const val = input.value.trim()
                      if (val && !aboutConfig.artisanRegions.includes(val)) {
                        setAboutConfig({ ...aboutConfig, artisanRegions: [...aboutConfig.artisanRegions, val] })
                        input.value = ""
                      }
                    }}
                    style={{
                      padding: "10px 16px",
                      background: primary[50],
                      color: primary[500],
                      border: `1px solid ${primary[200]}`,
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: fonts.body,
                    }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Save button */}
              <div>
                <button
                  onClick={handleSaveAbout}
                  disabled={savingAbout}
                  style={{
                    ...saveBtnStyle,
                    opacity: savingAbout ? 0.7 : 1,
                    cursor: savingAbout ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!savingAbout) e.currentTarget.style.background = primary[400] }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = primary[500] }}
                >
                  {savingAbout ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save About Page
                </button>
              </div>
            </div>
          )}

          {/* ── Contact Sub-tab ───────────────────────────────── */}
          {aboutSubTab === "contact" && (
            <div style={{ display: "grid", gap: "24px" }}>

              {/* Contact details */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Contact Details
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {(
                    [
                      { key: "phone", label: "Phone" },
                      { key: "email", label: "Support Email" },
                      { key: "whatsapp", label: "WhatsApp Number" },
                      { key: "wholesaleEmail", label: "Wholesale Email" },
                    ] as const
                  ).map(({ key, label }) => (
                    <div key={key}>
                      <label style={labelStyle}>{label}</label>
                      <input
                        type="text"
                        value={contactConfig[key]}
                        onChange={(e) => setContactConfig({ ...contactConfig, [key]: e.target.value })}
                        style={inputStyle}
                        onFocus={(evt) => (evt.target.style.borderColor = primary[400])}
                        onBlur={(evt) => (evt.target.style.borderColor = earth[300])}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label style={labelStyle}>Office Address</label>
                  <input
                    type="text"
                    value={contactConfig.address}
                    onChange={(e) => setContactConfig({ ...contactConfig, address: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Working Hours
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Weekdays</label>
                    <input
                      type="text"
                      value={contactConfig.workingHours.weekdays}
                      onChange={(e) => setContactConfig({ ...contactConfig, workingHours: { ...contactConfig.workingHours, weekdays: e.target.value } })}
                      style={inputStyle}
                      onFocus={(evt) => (evt.target.style.borderColor = primary[400])}
                      onBlur={(evt) => (evt.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Weekends</label>
                    <input
                      type="text"
                      value={contactConfig.workingHours.weekends}
                      onChange={(e) => setContactConfig({ ...contactConfig, workingHours: { ...contactConfig.workingHours, weekends: e.target.value } })}
                      style={inputStyle}
                      onFocus={(evt) => (evt.target.style.borderColor = primary[400])}
                      onBlur={(evt) => (evt.target.style.borderColor = earth[300])}
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Editor */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  FAQs
                </h3>
                <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
                  {contactConfig.faqs.map((faq, i) => (
                    <div
                      key={faq.id}
                      style={{
                        padding: "16px",
                        background: "#f9f6f3",
                        borderRadius: "8px",
                        border: `1px solid #e8ddd4`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "4px" }}>Question</label>
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const faqs = contactConfig.faqs.map((f, j) => j === i ? { ...f, question: e.target.value } : f)
                              setContactConfig({ ...contactConfig, faqs })
                            }}
                            style={{ ...inputStyle, fontSize: "13px", padding: "7px 10px" }}
                          />
                        </div>
                        <button
                          onClick={() => setContactConfig({ ...contactConfig, faqs: contactConfig.faqs.filter((_, j) => j !== i) })}
                          style={{ color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px", marginTop: "20px", flexShrink: 0 }}
                          title="Remove FAQ"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "12px", marginBottom: "4px" }}>Answer</label>
                        <textarea
                          value={faq.answer}
                          onChange={(e) => {
                            const faqs = contactConfig.faqs.map((f, j) => j === i ? { ...f, answer: e.target.value } : f)
                            setContactConfig({ ...contactConfig, faqs })
                          }}
                          rows={2}
                          style={{ ...inputStyle, fontSize: "13px", padding: "7px 10px", resize: "vertical" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const newFaq: FaqItem = {
                      id: "faq-" + Date.now(),
                      question: "New question?",
                      answer: "Answer here.",
                    }
                    setContactConfig({ ...contactConfig, faqs: [...contactConfig.faqs, newFaq] })
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "none",
                    border: `1px dashed ${primary[200]}`,
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: primary[500],
                    cursor: "pointer",
                    fontFamily: fonts.body,
                  }}
                >
                  <Plus size={14} /> Add FAQ
                </button>
              </div>

              {/* Grievance Officer */}
              <div>
                <h3 style={{ fontFamily: fonts.heading, fontSize: "1rem", fontWeight: 700, color: earth[700], margin: "0 0 16px" }}>
                  Grievance Officer
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text"
                      value={contactConfig.grievanceOfficer.name}
                      onChange={(e) => setContactConfig({ ...contactConfig, grievanceOfficer: { ...contactConfig.grievanceOfficer, name: e.target.value } })}
                      style={inputStyle}
                      onFocus={(evt) => (evt.target.style.borderColor = primary[400])}
                      onBlur={(evt) => (evt.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="text"
                      value={contactConfig.grievanceOfficer.email}
                      onChange={(e) => setContactConfig({ ...contactConfig, grievanceOfficer: { ...contactConfig.grievanceOfficer, email: e.target.value } })}
                      style={inputStyle}
                      onFocus={(evt) => (evt.target.style.borderColor = primary[400])}
                      onBlur={(evt) => (evt.target.style.borderColor = earth[300])}
                    />
                  </div>
                </div>
                <div style={{ marginTop: "16px" }}>
                  <label style={labelStyle}>Address</label>
                  <input
                    type="text"
                    value={contactConfig.grievanceOfficer.address}
                    onChange={(e) => setContactConfig({ ...contactConfig, grievanceOfficer: { ...contactConfig.grievanceOfficer, address: e.target.value } })}
                    style={inputStyle}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                  />
                </div>
              </div>

              {/* Save button */}
              <div>
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact}
                  style={{
                    ...saveBtnStyle,
                    opacity: savingContact ? 0.7 : 1,
                    cursor: savingContact ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => { if (!savingContact) e.currentTarget.style.background = primary[400] }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = primary[500] }}
                >
                  {savingContact ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Contact Page
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════ CONSULTATIONS TAB ══════════════════════════ */}
      {activeTab === "consultations" && (
        <div style={cardStyle}>
          <h2 style={{ fontFamily: fonts.heading, color: primary[900], fontSize: "1.1rem", fontWeight: 600, marginBottom: "24px" }}>
            Consultation Settings
          </h2>

          {/* ── Master Toggles ── */}
          <div style={{ marginBottom: "32px", padding: "20px", background: primary[50], borderRadius: "12px", border: `1px solid ${primary[100]}` }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: primary[700], textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Visibility Controls
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Homepage toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <div
                  onClick={() => setConsultationConfig({ ...consultationConfig, homepageSectionEnabled: !consultationConfig.homepageSectionEnabled })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
                    background: consultationConfig.homepageSectionEnabled ? primary[500] : earth[300],
                    transition: "background 200ms",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: consultationConfig.homepageSectionEnabled ? 22 : 2,
                    width: 20, height: 20, borderRadius: 10, background: "#fff",
                    transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Show consultation CTA on homepage</span>
                  <p style={{ fontSize: "12px", color: earth[400], marginTop: "2px" }}>
                    The promotional block with stats, testimonial, and CTAs
                  </p>
                </div>
              </label>
              {/* Route toggle */}
              <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}>
                <div
                  onClick={() => setConsultationConfig({ ...consultationConfig, consultationsRouteEnabled: !consultationConfig.consultationsRouteEnabled })}
                  style={{
                    width: 44, height: 24, borderRadius: 12, position: "relative", cursor: "pointer",
                    background: consultationConfig.consultationsRouteEnabled ? primary[500] : earth[300],
                    transition: "background 200ms",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 2, left: consultationConfig.consultationsRouteEnabled ? 22 : 2,
                    width: 20, height: 20, borderRadius: 10, background: "#fff",
                    transition: "left 200ms", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: earth[700] }}>Enable /consultations route</span>
                  <p style={{ fontSize: "12px", color: earth[400], marginTop: "2px" }}>
                    Hides the page and removes &ldquo;Consultations&rdquo; from all navigation when off
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Homepage CTA Copy ── */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: primary[700], textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Homepage CTA Section
            </p>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Eyebrow Text</label>
                <input type="text" value={consultationConfig.homepageEyebrow} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageEyebrow: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Headline</label>
                  <input type="text" value={consultationConfig.homepageHeadline} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageHeadline: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
                <div>
                  <label style={labelStyle}>Headline Accent</label>
                  <input type="text" value={consultationConfig.homepageHeadlineAccent} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageHeadlineAccent: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Sub-copy</label>
                <textarea value={consultationConfig.homepageSubcopy} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageSubcopy: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Primary CTA Label</label>
                  <input type="text" value={consultationConfig.homepagePrimaryCta} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepagePrimaryCta: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
                <div>
                  <label style={labelStyle}>Secondary CTA Label</label>
                  <input type="text" value={consultationConfig.homepageSecondaryCta} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageSecondaryCta: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
              </div>

              {/* Benefits list */}
              <div>
                <label style={labelStyle}>Benefits</label>
                {consultationConfig.homepageBenefits.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input type="text" value={b} onChange={(e) => { const arr = [...consultationConfig.homepageBenefits]; arr[i] = e.target.value; setConsultationConfig({ ...consultationConfig, homepageBenefits: arr }) }} style={{ ...inputStyle, flex: 1 }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <button onClick={() => { const arr = consultationConfig.homepageBenefits.filter((_, j) => j !== i); setConsultationConfig({ ...consultationConfig, homepageBenefits: arr }) }} style={{ background: "none", border: "none", cursor: "pointer", color: earth[300], padding: "4px" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setConsultationConfig({ ...consultationConfig, homepageBenefits: [...consultationConfig.homepageBenefits, ""] })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: `1px dashed ${primary[200]}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: primary[500], cursor: "pointer" }}><Plus size={13} /> Add Benefit</button>
              </div>

              {/* Stats */}
              <div>
                <label style={labelStyle}>Stats</label>
                {consultationConfig.homepageStats.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input type="text" value={s.value} placeholder="Value" onChange={(e) => { const arr = [...consultationConfig.homepageStats]; arr[i] = { ...arr[i], value: e.target.value }; setConsultationConfig({ ...consultationConfig, homepageStats: arr }) }} style={{ ...inputStyle, width: "100px" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <input type="text" value={s.label} placeholder="Label" onChange={(e) => { const arr = [...consultationConfig.homepageStats]; arr[i] = { ...arr[i], label: e.target.value }; setConsultationConfig({ ...consultationConfig, homepageStats: arr }) }} style={{ ...inputStyle, flex: 1 }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <button onClick={() => { const arr = consultationConfig.homepageStats.filter((_, j) => j !== i); setConsultationConfig({ ...consultationConfig, homepageStats: arr }) }} style={{ background: "none", border: "none", cursor: "pointer", color: earth[300], padding: "4px" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setConsultationConfig({ ...consultationConfig, homepageStats: [...consultationConfig.homepageStats, { value: "", label: "" }] })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: `1px dashed ${primary[200]}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: primary[500], cursor: "pointer" }}><Plus size={13} /> Add Stat</button>
              </div>

              {/* Testimonial */}
              <div>
                <label style={labelStyle}>Testimonial Quote</label>
                <textarea value={consultationConfig.homepageTestimonial.quote} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageTestimonial: { ...consultationConfig.homepageTestimonial, quote: e.target.value } })} rows={2} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div>
                <label style={labelStyle}>Testimonial Attribution</label>
                <input type="text" value={consultationConfig.homepageTestimonial.attribution} onChange={(e) => setConsultationConfig({ ...consultationConfig, homepageTestimonial: { ...consultationConfig.homepageTestimonial, attribution: e.target.value } })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
            </div>
          </div>

          {/* ── Dedicated Page Hero Copy ── */}
          <div style={{ marginBottom: "32px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: primary[700], textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>
              Consultations Page Hero
            </p>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Eyebrow</label>
                <input type="text" value={consultationConfig.pageEyebrow} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageEyebrow: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div>
                <label style={labelStyle}>Headline (use \n for line breaks)</label>
                <textarea value={consultationConfig.pageHeadline} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageHeadline: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div>
                <label style={labelStyle}>Sub-headline</label>
                <textarea value={consultationConfig.pageSubheadline} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageSubheadline: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Primary CTA Label</label>
                  <input type="text" value={consultationConfig.pagePrimaryCta} onChange={(e) => setConsultationConfig({ ...consultationConfig, pagePrimaryCta: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
                <div>
                  <label style={labelStyle}>Secondary CTA Label</label>
                  <input type="text" value={consultationConfig.pageSecondaryCta} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageSecondaryCta: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
              </div>

              {/* Feature checklist */}
              <div>
                <label style={labelStyle}>Feature Checklist</label>
                {consultationConfig.pageFeatureChecklist.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input type="text" value={item} onChange={(e) => { const arr = [...consultationConfig.pageFeatureChecklist]; arr[i] = e.target.value; setConsultationConfig({ ...consultationConfig, pageFeatureChecklist: arr }) }} style={{ ...inputStyle, flex: 1 }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <button onClick={() => { const arr = consultationConfig.pageFeatureChecklist.filter((_, j) => j !== i); setConsultationConfig({ ...consultationConfig, pageFeatureChecklist: arr }) }} style={{ background: "none", border: "none", cursor: "pointer", color: earth[300], padding: "4px" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setConsultationConfig({ ...consultationConfig, pageFeatureChecklist: [...consultationConfig.pageFeatureChecklist, ""] })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: `1px dashed ${primary[200]}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: primary[500], cursor: "pointer" }}><Plus size={13} /> Add Item</button>
              </div>

              {/* Page stats */}
              <div>
                <label style={labelStyle}>Stats Row</label>
                {consultationConfig.pageStats.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input type="text" value={s.value} placeholder="Value" onChange={(e) => { const arr = [...consultationConfig.pageStats]; arr[i] = { ...arr[i], value: e.target.value }; setConsultationConfig({ ...consultationConfig, pageStats: arr }) }} style={{ ...inputStyle, width: "100px" }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <input type="text" value={s.label} placeholder="Label" onChange={(e) => { const arr = [...consultationConfig.pageStats]; arr[i] = { ...arr[i], label: e.target.value }; setConsultationConfig({ ...consultationConfig, pageStats: arr }) }} style={{ ...inputStyle, flex: 1 }} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    <button onClick={() => { const arr = consultationConfig.pageStats.filter((_, j) => j !== i); setConsultationConfig({ ...consultationConfig, pageStats: arr }) }} style={{ background: "none", border: "none", cursor: "pointer", color: earth[300], padding: "4px" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setConsultationConfig({ ...consultationConfig, pageStats: [...consultationConfig.pageStats, { value: "", label: "" }] })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: `1px dashed ${primary[200]}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: primary[500], cursor: "pointer" }}><Plus size={13} /> Add Stat</button>
              </div>

              {/* Process Steps */}
              <div>
                <label style={labelStyle}>Process Steps</label>
                {consultationConfig.pageProcessSteps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "grid", gap: "6px" }}>
                      <input type="text" value={step.title} placeholder="Step title" onChange={(e) => { const arr = [...consultationConfig.pageProcessSteps]; arr[i] = { ...arr[i], title: e.target.value }; setConsultationConfig({ ...consultationConfig, pageProcessSteps: arr }) }} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                      <input type="text" value={step.description} placeholder="Step description" onChange={(e) => { const arr = [...consultationConfig.pageProcessSteps]; arr[i] = { ...arr[i], description: e.target.value }; setConsultationConfig({ ...consultationConfig, pageProcessSteps: arr }) }} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                    </div>
                    <button onClick={() => { const arr = consultationConfig.pageProcessSteps.filter((_, j) => j !== i); setConsultationConfig({ ...consultationConfig, pageProcessSteps: arr }) }} style={{ background: "none", border: "none", cursor: "pointer", color: earth[300], padding: "4px", marginTop: "8px" }}><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={() => setConsultationConfig({ ...consultationConfig, pageProcessSteps: [...consultationConfig.pageProcessSteps, { title: "", description: "" }] })} style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: `1px dashed ${primary[200]}`, borderRadius: "6px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: primary[500], cursor: "pointer" }}><Plus size={13} /> Add Step</button>
              </div>

              {/* Trust badge */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Trust Badge Title</label>
                  <input type="text" value={consultationConfig.pageTrustBadgeTitle} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageTrustBadgeTitle: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
                <div>
                  <label style={labelStyle}>Trust Badge Subtitle</label>
                  <input type="text" value={consultationConfig.pageTrustBadgeSubtitle} onChange={(e) => setConsultationConfig({ ...consultationConfig, pageTrustBadgeSubtitle: e.target.value })} style={inputStyle} onFocus={(e) => (e.target.style.borderColor = primary[400])} onBlur={(e) => (e.target.style.borderColor = earth[300])} />
                </div>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div>
            <button
              onClick={async () => {
                setSavingConsultation(true)
                try { await onSaveConsultationConfig(consultationConfig) } finally { setSavingConsultation(false) }
              }}
              disabled={savingConsultation}
              style={{ ...saveBtnStyle, opacity: savingConsultation ? 0.7 : 1, cursor: savingConsultation ? "not-allowed" : "pointer" }}
              onMouseEnter={(e) => { if (!savingConsultation) e.currentTarget.style.background = primary[400] }}
              onMouseLeave={(e) => { e.currentTarget.style.background = primary[500] }}
            >
              {savingConsultation ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Consultation Settings
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
