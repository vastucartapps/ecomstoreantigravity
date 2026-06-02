"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import {
  Image,
  Layout,
  BarChart3,
  Share2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  Globe,
  MousePointerClick,
  TrendingUp,
  Zap,
  Link2,
  Upload,
  Send,
  Settings,
  Search,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react"
import {
  primary,
  secondary,
  earth,
  bg,
  semantic,
  gradients,
  fonts,
  shadows,
} from "@/lib/theme"
import { normalizeImageUrl } from "@/lib/image-url"
import { ThemeSelect } from "@/components/ui/ThemeSelect"
import type {
  AdminEcosystemAdsProps,
  AdTab,
  Banner,
  BannerStatus,
  BannerFormData,
  BannerCreative,
  AspectRatio,
  EcosystemSite,
  PlacementSlot,
  BannerAnalytics,
  AnalyticsSummary,
  SocialAccount,
  SocialPost,
  SocialPostMeta,
  SocialPlatform,
  SocialPlatformConfig,
} from "@/types/admin-ecosystem-ads"

// ─── Constants ────────────────────────────────────────────────────────────────

const tabItems: { id: AdTab; label: string; icon: typeof Image }[] = [
  { id: "banners", label: "Banners", icon: Image },
  { id: "placements", label: "Placements", icon: Layout },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "social", label: "Social Publishing", icon: Share2 },
]

const statusColors: Record<BannerStatus, { bg: string; text: string }> = {
  draft: { bg: "#f3f4f6", text: earth[600] },
  scheduled: { bg: primary[50], text: primary[400] },
  live: { bg: semantic.successLight, text: semantic.success },
  expired: { bg: semantic.errorLight, text: semantic.error },
}

const ratioLabels: Record<AspectRatio, { label: string; px: string }> = {
  "1:1": { label: "Square", px: "1080\u00d71080" },
  "16:9": { label: "Landscape", px: "1920\u00d71080" },
  "9:16": { label: "Portrait", px: "1080\u00d71920" },
  "16:3": { label: "Strip", px: "1920\u00d7360" },
  "4:3": { label: "Content", px: "1200\u00d7900" },
  "2:3": { label: "Pinterest", px: "1000\u00d71500" },
}

const ALL_RATIOS: AspectRatio[] = ["1:1", "16:9", "9:16", "16:3", "4:3", "2:3"]

const platformMeta: Record<SocialPlatform, { label: string; color: string; ratio: AspectRatio }> = {
  pinterest: { label: "Pinterest", color: "#E60023", ratio: "2:3" },
  instagram: { label: "Instagram", color: "#E4405F", ratio: "1:1" },
  facebook: { label: "Facebook", color: "#1877F2", ratio: "16:9" },
  twitter: { label: "Twitter / X", color: "#1DA1F2", ratio: "16:9" },
  threads: { label: "Threads", color: "#000000", ratio: "1:1" },
}

const cardStyle = {
  background: `linear-gradient(${bg.card}, ${bg.card}) padding-box, ${gradients.accentBorder} border-box`,
  boxShadow: shadows.card,
  borderTop: "4px solid transparent",
}

function formatDateShort(d: string | null) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle?: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
      style={{ backgroundColor: enabled ? semantic.success : earth[300] }}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: enabled ? "translateX(24px)" : "translateX(4px)" }}
      />
    </button>
  )
}

function DeleteConfirmDialog({
  message,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl"
        style={{ backgroundColor: bg.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ color: earth[700], fontFamily: fonts.body }} className="text-sm mb-4">
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: bg.primary, color: earth[600], border: `1px solid ${earth[300]}` }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{ backgroundColor: semantic.error, color: "white", opacity: isDeleting ? 0.6 : 1 }}
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Banner Form ──────────────────────────────────────────────────────────────

const emptyFormData: BannerFormData = {
  name: "",
  headline: "",
  cta_text: "Shop Now",
  cta_url: "",
  status: "draft",
  is_active: false,
  start_date: "",
  end_date: "",
  priority: 1,
  product_ids: [],
  product_names: [],
  creatives: [],
}

function BannerForm({
  initialData,
  onSave,
  onCancel,
  onUploadFile,
  onSearchProducts,
}: {
  initialData?: Partial<BannerFormData>
  onSave: (data: BannerFormData) => Promise<void>
  onCancel: () => void
  onUploadFile: (file: File) => Promise<string>
  onSearchProducts: (query: string) => Promise<{ id: string; title: string }[]>
}) {
  const isEditing = !!initialData?.name
  const [form, setForm] = useState<BannerFormData>({ ...emptyFormData, ...initialData })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingRatio, setUploadingRatio] = useState<AspectRatio | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ id: string; title: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q)
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      if (!q.trim()) {
        setSearchResults([])
        setShowSearchDropdown(false)
        return
      }
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true)
        try {
          const results = await onSearchProducts(q)
          setSearchResults(results.filter((r) => !form.product_ids.includes(r.id)))
          setShowSearchDropdown(true)
        } catch {
          /* ignore */
        } finally {
          setIsSearching(false)
        }
      }, 300)
    },
    [onSearchProducts, form.product_ids]
  )

  const addProduct = (id: string, title: string) => {
    setForm((f) => ({
      ...f,
      product_ids: [...f.product_ids, id],
      product_names: [...f.product_names, title],
    }))
    setSearchQuery("")
    setSearchResults([])
    setShowSearchDropdown(false)
  }

  const removeProduct = (idx: number) => {
    setForm((f) => ({
      ...f,
      product_ids: f.product_ids.filter((_, i) => i !== idx),
      product_names: f.product_names.filter((_, i) => i !== idx),
    }))
  }

  const handleCreativeUpload = async (ratio: AspectRatio, file: File) => {
    setUploadingRatio(ratio)
    try {
      const url = await onUploadFile(file)
      const dims = ratioLabels[ratio].px.split("\u00d7")
      const w = parseInt(dims[0])
      const h = parseInt(dims[1])
      setForm((f) => ({
        ...f,
        creatives: [
          ...f.creatives.filter((c) => c.ratio !== ratio),
          { ratio, imageUrl: url, width: w, height: h },
        ],
      }))
    } catch {
      /* ignore */
    } finally {
      setUploadingRatio(null)
    }
  }

  const removeCreative = (ratio: AspectRatio) => {
    setForm((f) => ({ ...f, creatives: f.creatives.filter((c) => c.ratio !== ratio) }))
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) return
    setIsSubmitting(true)
    try {
      await onSave(form)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputStyle = {
    borderColor: earth[300],
    color: earth[700],
    fontFamily: fonts.body,
  }

  return (
    <div
      className="rounded-lg overflow-hidden mb-6"
      style={cardStyle}
    >
      <div className="p-6">
        <h3 style={{ fontFamily: fonts.heading, color: earth[700] }} className="text-lg font-semibold mb-5">
          {isEditing ? "Edit Banner" : "Create New Banner"}
        </h3>

        {/* Basic fields */}
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              Banner Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Summer Sale Hero Banner"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              Headline
            </label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="e.g. Up to 40% Off on Home Decor"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              CTA Text
            </label>
            <input
              type="text"
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              placeholder="Shop Now"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              CTA URL
            </label>
            <input
              type="url"
              value={form.cta_url}
              onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
              placeholder="https://vastucart.in/..."
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ ...inputStyle, fontFamily: fonts.mono, fontSize: "12px" }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              Status
            </label>
            <ThemeSelect
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as BannerStatus })}
              options={[
                { value: "draft", label: "Draft" },
                { value: "scheduled", label: "Scheduled" },
                { value: "live", label: "Live" },
              ]}
            />
          </div>
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              Priority
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span style={{ color: earth[600], fontFamily: fonts.body }} className="text-sm">
                Active
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-5">
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              <Calendar size={12} className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-1">
              <Calendar size={12} className="inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Product Picker */}
        <div className="mb-5">
          <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-2">
            Linked Products
          </label>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: earth[400] }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
              placeholder="Search products to link..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              style={inputStyle}
            />
            {isSearching && (
              <Loader2
                size={14}
                className="animate-spin absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: earth[400] }}
              />
            )}
            {showSearchDropdown && searchResults.length > 0 && (
              <div
                className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border shadow-lg max-h-48 overflow-y-auto"
                style={{ backgroundColor: bg.card, borderColor: earth[300] }}
              >
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onMouseDown={() => addProduct(r.id, r.title)}
                    className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: earth[700], fontFamily: fonts.body, borderBottom: `1px solid ${earth[300]}` }}
                  >
                    {r.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          {form.product_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.product_names.map((name, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: secondary[50], color: secondary[500] }}
                >
                  {name}
                  <button onClick={() => removeProduct(idx)}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Creative Upload */}
        <div className="mb-5">
          <label style={{ color: earth[600], fontFamily: fonts.body }} className="block text-sm font-medium mb-2">
            Creatives (upload for each aspect ratio)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file && uploadingRatio) handleCreativeUpload(uploadingRatio, file)
              e.target.value = ""
            }}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_RATIOS.map((ratio) => {
              const existing = form.creatives.find((c) => c.ratio === ratio)
              const isUploading = uploadingRatio === ratio
              const rl = ratioLabels[ratio]
              const [w, h] = rl.px.split("\u00d7").map(Number)
              const aspect = w / h

              return (
                <div key={ratio} className="text-center">
                  <div
                    className="rounded-lg border-2 border-dashed relative overflow-hidden flex items-center justify-center cursor-pointer mx-auto mb-1 transition-colors"
                    style={{
                      borderColor: existing ? semantic.success : earth[300],
                      backgroundColor: existing ? bg.primary : "#f9fafb",
                      width: "100%",
                      maxWidth: 140,
                      aspectRatio: String(Math.min(aspect, 2.5)),
                      minHeight: 48,
                    }}
                    onClick={() => {
                      if (!isUploading && !existing) {
                        setUploadingRatio(ratio)
                        fileInputRef.current?.click()
                      }
                    }}
                  >
                    {isUploading ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: primary[400] }} />
                    ) : existing ? (
                      <>
                        <img
                          src={normalizeImageUrl(existing.imageUrl)}
                          alt={ratio}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeCreative(ratio)
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: semantic.error, color: "white" }}
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload size={14} style={{ color: earth[400] }} />
                        <span style={{ color: earth[400], fontFamily: fonts.mono }} className="text-[10px]">
                          Upload
                        </span>
                      </div>
                    )}
                  </div>
                  <p style={{ color: earth[600], fontFamily: fonts.mono }} className="text-[10px] font-medium">
                    {ratio} &middot; {rl.label}
                  </p>
                  <p style={{ color: earth[400], fontFamily: fonts.mono }} className="text-[10px]">
                    {rl.px}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4" style={{ borderTop: `1px solid ${earth[300]}` }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.name.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: primary[500],
              color: "white",
              opacity: isSubmitting || !form.name.trim() ? 0.6 : 1,
            }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {isEditing ? "Save Changes" : "Create Banner"}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: bg.primary, color: earth[600], border: `1px solid ${earth[300]}` }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Banner Card ──────────────────────────────────────────────────────────────

function BannerCard({
  banner,
  onToggle,
  onEdit,
  onDelete,
}: {
  banner: Banner
  onToggle?: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const sc = statusColors[banner.status]
  const ctr =
    banner.impressions > 0 ? ((banner.clicks / banner.impressions) * 100).toFixed(1) : "0.0"

  return (
    <div className="rounded-lg overflow-hidden" style={cardStyle}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4
                style={{ fontFamily: fonts.heading, color: earth[700] }}
                className="font-semibold text-base"
              >
                {banner.name}
              </h4>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ backgroundColor: sc.bg, color: sc.text }}
              >
                {banner.status}
              </span>
            </div>
            <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm">
              {banner.headline}
            </p>
          </div>
          <ToggleSwitch enabled={banner.is_active} onToggle={onToggle} />
        </div>

        {/* Creative ratio badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {banner.creatives.map((cr) => (
            <span
              key={cr.ratio}
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: primary[50], color: primary[500], fontFamily: fonts.mono }}
            >
              {cr.ratio}
            </span>
          ))}
          {ALL_RATIOS.filter((r) => !banner.creatives.find((cr) => cr.ratio === r)).map((r) => (
            <span
              key={r}
              className="text-xs px-2 py-1 rounded"
              style={{
                backgroundColor: "#f3f4f6",
                color: earth[400],
                fontFamily: fonts.mono,
                textDecoration: "line-through",
              }}
            >
              {r}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 flex-wrap">
          <span
            style={{ color: earth[500], fontFamily: fonts.mono }}
            className="text-xs flex items-center gap-1"
          >
            <Eye size={12} /> {banner.impressions.toLocaleString()} impr
          </span>
          <span
            style={{ color: earth[500], fontFamily: fonts.mono }}
            className="text-xs flex items-center gap-1"
          >
            <MousePointerClick size={12} /> {banner.clicks.toLocaleString()} clicks
          </span>
          <span
            style={{ color: primary[500], fontFamily: fonts.mono }}
            className="text-xs font-medium"
          >
            {ctr}% CTR
          </span>
        </div>

        {/* Schedule */}
        <p style={{ color: earth[400], fontFamily: fonts.mono }} className="text-xs mb-3">
          {formatDateShort(banner.start_date)} \u2014 {formatDateShort(banner.end_date)}
        </p>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs flex items-center gap-1 mb-2"
          style={{ color: primary[500], fontFamily: fonts.body }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Less details" : "More details"}
        </button>

        {expanded && (
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${earth[300]}` }}>
            {/* Products */}
            {banner.product_names.length > 0 && (
              <div className="mb-3">
                <p
                  style={{ color: earth[600], fontFamily: fonts.body }}
                  className="text-xs font-medium mb-1"
                >
                  Linked Products
                </p>
                <div className="flex flex-wrap gap-1">
                  {banner.product_names.map((name) => (
                    <span
                      key={name}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: secondary[50], color: secondary[500] }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Placements */}
            <div className="mb-3">
              <p
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="text-xs font-medium mb-1"
              >
                Active Placements
              </p>
              {banner.placements.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {banner.placements.map((p) => (
                    <span
                      key={p}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: primary[50],
                        color: primary[500],
                        fontFamily: fonts.mono,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p
                  style={{ color: earth[400], fontFamily: fonts.body }}
                  className="text-xs italic"
                >
                  No placements assigned
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="mb-3">
              <p
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="text-xs font-medium mb-1"
              >
                CTA
              </p>
              <p style={{ color: earth[500], fontFamily: fonts.mono }} className="text-xs">
                &ldquo;{banner.cta_text}&rdquo; &rarr; {banner.cta_url || "\u2014"}
              </p>
            </div>

            {/* Creative previews */}
            <div>
              <p
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="text-xs font-medium mb-2"
              >
                Creatives
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {banner.creatives.map((cr) => {
                  const aspect = cr.width / cr.height
                  return (
                    <div key={cr.ratio} className="text-center">
                      <div
                        className="rounded border overflow-hidden mx-auto mb-1"
                        style={{
                          borderColor: earth[300],
                          backgroundColor: bg.primary,
                          width: "100%",
                          maxWidth: 80,
                          aspectRatio: String(aspect),
                        }}
                      >
                        {cr.imageUrl ? (
                          <img
                            src={normalizeImageUrl(cr.imageUrl)}
                            alt={cr.ratio}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image size={16} style={{ color: earth[400] }} />
                          </div>
                        )}
                      </div>
                      <span
                        style={{ color: earth[500], fontFamily: fonts.mono }}
                        className="text-[10px]"
                      >
                        {cr.ratio}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${earth[300]}` }}>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: primary[50],
              color: primary[500],
              border: `1px solid ${primary[200]}`,
            }}
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{ backgroundColor: semantic.errorLight, color: semantic.error }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Banners Tab ──────────────────────────────────────────────────────────────

function BannersTab({
  banners,
  onToggleBanner,
  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
  onUploadFile,
  onSearchProducts,
}: {
  banners: Banner[]
  onToggleBanner: (id: string) => Promise<void>
  onCreateBanner: (data: BannerFormData) => Promise<void>
  onEditBanner: (id: string, data: Partial<BannerFormData>) => Promise<void>
  onDeleteBanner: (id: string) => Promise<void>
  onUploadFile: (file: File) => Promise<string>
  onSearchProducts: (query: string) => Promise<{ id: string; title: string }[]>
}) {
  const [filter, setFilter] = useState<BannerStatus | "all">("all")
  const [formMode, setFormMode] = useState<null | "create" | string>(null) // null | "create" | bannerId
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = filter === "all" ? banners : banners.filter((b) => b.status === filter)
  const statuses: (BannerStatus | "all")[] = ["all", "live", "scheduled", "draft", "expired"]

  const editingBanner =
    formMode && formMode !== "create" ? banners.find((b) => b.id === formMode) : null

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setIsDeleting(true)
    try {
      await onDeleteBanner(deleteConfirm)
    } finally {
      setIsDeleting(false)
      setDeleteConfirm(null)
    }
  }

  // Show form if creating or editing
  if (formMode) {
    const initialData: Partial<BannerFormData> | undefined = editingBanner
      ? {
          name: editingBanner.name,
          headline: editingBanner.headline,
          cta_text: editingBanner.cta_text,
          cta_url: editingBanner.cta_url,
          status: editingBanner.status,
          is_active: editingBanner.is_active,
          start_date: editingBanner.start_date
            ? new Date(editingBanner.start_date).toISOString().slice(0, 10)
            : "",
          end_date: editingBanner.end_date
            ? new Date(editingBanner.end_date).toISOString().slice(0, 10)
            : "",
          priority: editingBanner.priority,
          product_ids: editingBanner.product_ids,
          product_names: editingBanner.product_names,
          creatives: editingBanner.creatives,
        }
      : undefined

    return (
      <BannerForm
        initialData={initialData}
        onSave={async (data) => {
          if (formMode === "create") {
            await onCreateBanner(data)
          } else {
            await onEditBanner(formMode, data)
          }
          setFormMode(null)
        }}
        onCancel={() => setFormMode(null)}
        onUploadFile={onUploadFile}
        onSearchProducts={onSearchProducts}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => {
            const count =
              s === "all" ? banners.length : banners.filter((b) => b.status === s).length
            const isActive = filter === s
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-all"
                style={{
                  backgroundColor: isActive ? primary[500] : bg.primary,
                  color: isActive ? bg.card : earth[500],
                  border: `1px solid ${isActive ? primary[500] : earth[300]}`,
                }}
              >
                {s} ({count})
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setFormMode("create")}
          className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
          style={{ backgroundColor: primary[500], color: bg.card }}
        >
          <Plus size={16} />
          New Banner
        </button>
      </div>

      {/* Banner grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((banner) => (
          <BannerCard
            key={banner.id}
            banner={banner}
            onToggle={() => onToggleBanner(banner.id)}
            onEdit={() => setFormMode(banner.id)}
            onDelete={() => setDeleteConfirm(banner.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Image size={48} style={{ color: earth[300] }} className="mx-auto mb-3" />
          <p style={{ color: earth[500], fontFamily: fonts.body }}>No banners found</p>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <DeleteConfirmDialog
          message="Are you sure you want to delete this banner? This will also remove it from any placement slots."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  )
}

// ─── Slot Form ────────────────────────────────────────────────────────────────

function SlotForm({
  onSave,
  onCancel,
}: {
  onSave: (name: string, ratio: AspectRatio) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [ratio, setRatio] = useState<AspectRatio>("16:9")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setIsSubmitting(true)
    try {
      await onSave(name, ratio)
      setName("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="p-3 rounded-lg mt-2"
      style={{ backgroundColor: bg.primary, border: `1px solid ${earth[300]}` }}
    >
      <p
        style={{ color: earth[600], fontFamily: fonts.body }}
        className="text-xs font-medium mb-2"
      >
        New Slot
      </p>
      <div className="flex gap-2 items-end flex-wrap">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Slot name (e.g. Hero Banner)"
          className="flex-1 min-w-[140px] px-3 py-1.5 rounded-lg border text-sm"
          style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
        />
        <ThemeSelect
          value={ratio}
          onChange={(v) => setRatio(v as AspectRatio)}
          options={ALL_RATIOS.map((r) => ({
            value: r,
            label: `${r} (${ratioLabels[r].label})`,
          }))}
          size="sm"
        />
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
          style={{
            backgroundColor: primary[500],
            color: "white",
            opacity: isSubmitting || !name.trim() ? 0.6 : 1,
          }}
        >
          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ color: earth[500] }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Site Card ────────────────────────────────────────────────────────────────

function SiteCard({
  site,
  banners,
  onToggleSite,
  onDeleteSite,
  onAssign,
  onRemove,
  onCreateSlot,
}: {
  site: EcosystemSite
  banners: Banner[]
  onToggleSite?: () => void
  onDeleteSite?: () => void
  onAssign?: (slotId: string, bannerId: string) => void
  onRemove?: (slotId: string) => void
  onCreateSlot?: (siteId: string, name: string, ratio: AspectRatio) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [showSlotForm, setShowSlotForm] = useState(false)
  const activeSlots = site.slots.filter((s) => s.current_banner_id).length

  return (
    <div className="rounded-lg overflow-hidden" style={cardStyle}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Globe size={18} style={{ color: primary[500] }} />
            <div>
              <h4
                style={{ fontFamily: fonts.heading, color: earth[700] }}
                className="font-semibold"
              >
                {site.display_name}
              </h4>
              <p style={{ color: primary[500], fontFamily: fonts.mono }} className="text-xs">
                {site.subdomain}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span style={{ color: earth[500], fontFamily: fonts.mono }} className="text-xs">
              {activeSlots}/{site.slots.length} slots filled
            </span>
            <ToggleSwitch enabled={site.is_active} onToggle={onToggleSite} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs flex items-center gap-1"
            style={{ color: primary[500], fontFamily: fonts.body }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? "Hide slots" : `Show ${site.slots.length} slots`}
          </button>
          <button
            onClick={onDeleteSite}
            className="text-xs flex items-center gap-1"
            style={{ color: semantic.error }}
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2">
            {site.slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg"
                style={{ backgroundColor: bg.primary, border: `1px solid ${earth[300]}` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      style={{ color: earth[700], fontFamily: fonts.body }}
                      className="font-medium text-sm"
                    >
                      {slot.name}
                    </p>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: primary[50],
                        color: primary[500],
                        fontFamily: fonts.mono,
                      }}
                    >
                      {slot.ratio}
                    </span>
                  </div>
                  {slot.current_banner_name ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Link2 size={10} style={{ color: semantic.success }} />
                      <span
                        style={{ color: semantic.success, fontFamily: fonts.body }}
                        className="text-xs"
                      >
                        {slot.current_banner_name}
                      </span>
                      <button
                        onClick={() => onRemove?.(slot.id)}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ color: semantic.error, backgroundColor: semantic.errorLight }}
                      >
                        <X size={10} className="inline" />
                      </button>
                    </div>
                  ) : (
                    <ThemeSelect
                      value=""
                      onChange={(v) => { if (v) onAssign?.(slot.id, v) }}
                      options={[
                        { value: "", label: "Assign banner..." },
                        ...banners
                          .filter((b) => b.is_active)
                          .map((b) => ({ value: b.id, label: b.name })),
                      ]}
                      placeholder="Assign banner..."
                      size="sm"
                    />
                  )}
                </div>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: slot.is_active ? semantic.success : earth[300] }}
                />
              </div>
            ))}

            {/* Add slot */}
            {showSlotForm ? (
              <SlotForm
                onSave={async (name, ratio) => {
                  await onCreateSlot?.(site.id, name, ratio)
                  setShowSlotForm(false)
                }}
                onCancel={() => setShowSlotForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowSlotForm(true)}
                className="w-full p-2 rounded-lg border-2 border-dashed text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                style={{ borderColor: earth[300], color: primary[500] }}
              >
                <Plus size={12} /> Add Slot
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Placements Tab ───────────────────────────────────────────────────────────

function PlacementsTab({
  sites,
  banners,
  onToggleSite,
  onDeleteSite,
  onCreateSite,
  onAssign,
  onRemove,
  onCreateSlot,
}: {
  sites: EcosystemSite[]
  banners: Banner[]
  onToggleSite: (siteId: string) => Promise<void>
  onDeleteSite: (id: string) => Promise<void>
  onCreateSite: (subdomain: string, displayName: string) => Promise<void>
  onAssign: (slotId: string, bannerId: string) => Promise<void>
  onRemove: (slotId: string) => Promise<void>
  onCreateSlot: (siteId: string, name: string, ratio: AspectRatio) => Promise<void>
}) {
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [siteSubdomain, setSiteSubdomain] = useState("")
  const [siteDisplayName, setSiteDisplayName] = useState("")
  const [isCreatingSite, setIsCreatingSite] = useState(false)
  const [deleteSiteConfirm, setDeleteSiteConfirm] = useState<string | null>(null)
  const [isDeletingSite, setIsDeletingSite] = useState(false)

  const totalSlots = sites.reduce((sum, s) => sum + s.slots.length, 0)
  const filledSlots = sites.reduce(
    (sum, s) => sum + s.slots.filter((sl) => sl.current_banner_id).length,
    0
  )

  const handleCreateSite = async () => {
    if (!siteSubdomain.trim() || !siteDisplayName.trim()) return
    setIsCreatingSite(true)
    try {
      await onCreateSite(siteSubdomain, siteDisplayName)
      setSiteSubdomain("")
      setSiteDisplayName("")
      setShowSiteForm(false)
    } finally {
      setIsCreatingSite(false)
    }
  }

  const handleDeleteSite = async () => {
    if (!deleteSiteConfirm) return
    setIsDeletingSite(true)
    try {
      await onDeleteSite(deleteSiteConfirm)
    } finally {
      setIsDeletingSite(false)
      setDeleteSiteConfirm(null)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-5 flex-wrap">
        <span
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: primary[50], color: primary[500], fontFamily: fonts.mono }}
        >
          {sites.length} sites
        </span>
        <span
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{
            backgroundColor: semantic.successLight,
            color: semantic.success,
            fontFamily: fonts.mono,
          }}
        >
          {filledSlots}/{totalSlots} slots filled
        </span>
        <button
          onClick={() => setShowSiteForm(!showSiteForm)}
          className="px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 ml-auto"
          style={{ backgroundColor: primary[500], color: bg.card }}
        >
          <Plus size={14} /> Add Site
        </button>
      </div>

      {/* Site create form */}
      {showSiteForm && (
        <div className="rounded-lg p-4 mb-5" style={cardStyle}>
          <p
            style={{ color: earth[700], fontFamily: fonts.heading }}
            className="font-semibold mb-3"
          >
            Add Ecosystem Site
          </p>
          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="block text-xs font-medium mb-1"
              >
                Subdomain
              </label>
              <input
                type="text"
                value={siteSubdomain}
                onChange={(e) => setSiteSubdomain(e.target.value)}
                placeholder="e.g. blog.vastucart.in"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.mono }}
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="block text-xs font-medium mb-1"
              >
                Display Name
              </label>
              <input
                type="text"
                value={siteDisplayName}
                onChange={(e) => setSiteDisplayName(e.target.value)}
                placeholder="e.g. VastuCart Blog"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
              />
            </div>
            <button
              onClick={handleCreateSite}
              disabled={isCreatingSite || !siteSubdomain.trim() || !siteDisplayName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
              style={{
                backgroundColor: primary[500],
                color: "white",
                opacity:
                  isCreatingSite || !siteSubdomain.trim() || !siteDisplayName.trim() ? 0.6 : 1,
              }}
            >
              {isCreatingSite && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
            <button
              onClick={() => setShowSiteForm(false)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ color: earth[500] }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((site) => (
          <SiteCard
            key={site.id}
            site={site}
            banners={banners}
            onToggleSite={() => onToggleSite(site.id)}
            onDeleteSite={() => setDeleteSiteConfirm(site.id)}
            onAssign={onAssign}
            onRemove={onRemove}
            onCreateSlot={onCreateSlot}
          />
        ))}
      </div>

      {sites.length === 0 && (
        <div className="text-center py-12">
          <Globe size={48} style={{ color: earth[300] }} className="mx-auto mb-3" />
          <p style={{ color: earth[500], fontFamily: fonts.body }}>No ecosystem sites yet</p>
        </div>
      )}

      {deleteSiteConfirm && (
        <DeleteConfirmDialog
          message="Are you sure you want to delete this site? All its slots will also be removed."
          onConfirm={handleDeleteSite}
          onCancel={() => setDeleteSiteConfirm(null)}
          isDeleting={isDeletingSite}
        />
      )}
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab({
  summary,
  analytics,
  onFetchAnalytics,
}: {
  summary: AnalyticsSummary
  analytics: BannerAnalytics[]
  onFetchAnalytics: (period?: string) => Promise<void>
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Generate last 6 months
  const periodOptions: { value: string; label: string }[] = [{ value: "", label: "All Time" }]
  const now = new Date()
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    periodOptions.push({ value: val, label })
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period)
    setIsRefreshing(true)
    try {
      await onFetchAnalytics(period || undefined)
    } finally {
      setIsRefreshing(false)
    }
  }

  const statCards = [
    {
      label: "Total Impressions",
      value: summary.totalImpressions.toLocaleString(),
      icon: Eye,
      color: primary[500],
      iconBg: primary[50],
    },
    {
      label: "Total Clicks",
      value: summary.totalClicks.toLocaleString(),
      icon: MousePointerClick,
      color: secondary[500],
      iconBg: secondary[50],
    },
    {
      label: "Avg. CTR",
      value: `${summary.avgCtr}%`,
      icon: TrendingUp,
      color: semantic.success,
      iconBg: semantic.successLight,
    },
    {
      label: "Active Banners",
      value: String(summary.activeBanners),
      icon: Zap,
      color: semantic.warning,
      iconBg: semantic.warningLight,
    },
  ]

  return (
    <div>
      {/* Period selector */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <ThemeSelect
          value={selectedPeriod}
          onChange={(v) => handlePeriodChange(v)}
          options={periodOptions.map((p) => ({ value: p.value, label: p.label }))}
          size="sm"
        />
        {isRefreshing && (
          <Loader2 size={16} className="animate-spin" style={{ color: primary[400] }} />
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-lg p-4" style={cardStyle}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.iconBg }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <p
                style={{ fontFamily: fonts.heading, color: earth[700] }}
                className="text-xl font-semibold"
              >
                {stat.value}
              </p>
              <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-xs mt-1">
                {stat.label}
              </p>
            </div>
          )
        })}
      </div>

      {/* Analytics table */}
      <div className="rounded-lg overflow-hidden" style={cardStyle}>
        <div className="p-5">
          <h3
            style={{ fontFamily: fonts.heading, color: earth[700] }}
            className="text-lg font-semibold mb-4"
          >
            Performance by Banner &amp; Site
          </h3>
          {analytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ fontFamily: fonts.body }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${earth[300]}` }}>
                    {["Banner", "Site", "Impressions", "Clicks", "CTR", "Period"].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-3 font-medium text-xs uppercase tracking-wider"
                        style={{ color: earth[500] }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((row, i) => (
                    <tr
                      key={`${row.bannerId}-${row.site}-${i}`}
                      style={{ borderBottom: `1px solid ${earth[300]}` }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <td className="py-3 px-3 font-medium" style={{ color: earth[700] }}>
                        {row.bannerName}
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: primary[500], fontFamily: fonts.mono, fontSize: "12px" }}
                      >
                        {row.site}
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: earth[600], fontFamily: fonts.mono }}
                      >
                        {row.impressions.toLocaleString()}
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: earth[600], fontFamily: fonts.mono }}
                      >
                        {row.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor:
                              row.ctr >= 7 ? semantic.successLight : semantic.warningLight,
                            color: row.ctr >= 7 ? semantic.success : semantic.warning,
                          }}
                        >
                          {row.ctr}%
                        </span>
                      </td>
                      <td
                        className="py-3 px-3"
                        style={{ color: earth[400], fontFamily: fonts.mono, fontSize: "12px" }}
                      >
                        {row.period}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 size={32} style={{ color: earth[300] }} className="mx-auto mb-2" />
              <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm">
                No analytics data yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Social Config Modal ──────────────────────────────────────────────────────

const platformFields: Record<
  SocialPlatform,
  { key: string; label: string; placeholder: string; type?: string }[]
> = {
  pinterest: [
    { key: "access_token", label: "Access Token", placeholder: "Your Pinterest API access token" },
    { key: "board_id", label: "Board ID", placeholder: "Target board ID for pins" },
    { key: "username", label: "Username", placeholder: "@your_username" },
    { key: "display_name", label: "Display Name", placeholder: "Pinterest account name" },
  ],
  instagram: [
    { key: "access_token", label: "Access Token", placeholder: "Meta Graph API access token" },
    { key: "ig_user_id", label: "IG User ID", placeholder: "Instagram Business user ID" },
    { key: "username", label: "Username", placeholder: "@your_username" },
    { key: "display_name", label: "Display Name", placeholder: "Instagram account name" },
  ],
  facebook: [
    { key: "access_token", label: "Page Access Token", placeholder: "Facebook Page access token" },
    { key: "page_id", label: "Page ID", placeholder: "Facebook Page ID" },
    { key: "username", label: "Username", placeholder: "Page handle" },
    { key: "display_name", label: "Display Name", placeholder: "Facebook Page name" },
  ],
  twitter: [
    { key: "api_key", label: "API Key", placeholder: "Twitter API key" },
    { key: "api_secret", label: "API Secret", placeholder: "Twitter API secret", type: "password" },
    { key: "access_token", label: "Access Token", placeholder: "OAuth access token" },
    {
      key: "access_token_secret",
      label: "Access Token Secret",
      placeholder: "OAuth access token secret",
      type: "password",
    },
    { key: "username", label: "Username", placeholder: "@your_handle" },
    { key: "display_name", label: "Display Name", placeholder: "Account display name" },
  ],
  threads: [
    { key: "access_token", label: "Access Token", placeholder: "Threads API access token" },
    { key: "user_id", label: "User ID", placeholder: "Threads user ID" },
    { key: "username", label: "Username", placeholder: "@your_username" },
    { key: "display_name", label: "Display Name", placeholder: "Threads account name" },
  ],
}

function SocialConfigModal({
  platform,
  onSave,
  onClose,
}: {
  platform: SocialPlatform
  onSave: (platform: SocialPlatform, config: SocialPlatformConfig) => Promise<void>
  onClose: () => void
}) {
  const fields = platformFields[platform]
  const meta = platformMeta[platform]
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    fields.forEach((f) => (init[f.key] = ""))
    return init
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      await onSave(platform, values as unknown as SocialPlatformConfig)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="rounded-xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: bg.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label[0]}
          </div>
          <h3 style={{ fontFamily: fonts.heading, color: earth[700] }} className="text-lg font-semibold">
            Connect {meta.label}
          </h3>
        </div>

        <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm mb-4">
          Enter your {meta.label} API credentials to enable publishing.
        </p>

        <div className="space-y-3 mb-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label
                style={{ color: earth[600], fontFamily: fonts.body }}
                className="block text-sm font-medium mb-1"
              >
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                value={values[field.key]}
                onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.mono }}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: bg.primary, color: earth[600], border: `1px solid ${earth[300]}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting || !values.access_token?.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
            style={{
              backgroundColor: meta.color,
              color: "white",
              opacity: isSubmitting || !values.access_token?.trim() ? 0.6 : 1,
            }}
          >
            {isSubmitting && <Loader2 size={14} className="animate-spin" />}
            Save &amp; Connect
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Social Tab ───────────────────────────────────────────────────────────────

function SocialTab({
  accounts,
  posts,
  banners,
  onSaveSocialConfig,
  onPublishToSocial,
}: {
  accounts: SocialAccount[]
  posts: SocialPost[]
  banners: Banner[]
  onSaveSocialConfig: (platform: SocialPlatform, config: SocialPlatformConfig) => Promise<void>
  onPublishToSocial: (
    bannerId: string,
    platform: SocialPlatform,
    caption: string,
    meta: SocialPostMeta
  ) => Promise<void>
}) {
  const [configModal, setConfigModal] = useState<SocialPlatform | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishForm, setPublishForm] = useState<{
    platform: SocialPlatform
    bannerId: string
    caption: string
    title: string
    headline: string
    description: string
    linkUrl: string
    ctaText: string
    hashtags: string
    altText: string
  } | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<SocialPlatform | "all">("all")

  const postStatusColors: Record<string, { bg: string; text: string }> = {
    published: { bg: semantic.successLight, text: semantic.success },
    pending: { bg: semantic.warningLight, text: semantic.warning },
    failed: { bg: semantic.errorLight, text: semantic.error },
  }

  const filteredPosts =
    filterPlatform === "all" ? posts : posts.filter((p) => p.platform === filterPlatform)

  const handleDisconnect = async (platform: SocialPlatform) => {
    await onSaveSocialConfig(platform, {
      access_token: "",
      username: "",
      display_name: "",
    } as SocialPlatformConfig)
  }

  const handlePublish = async () => {
    if (!publishForm?.bannerId) return
    setIsPublishing(true)
    try {
      await onPublishToSocial(publishForm.bannerId, publishForm.platform, publishForm.caption, {
        title: publishForm.title,
        headline: publishForm.headline,
        description: publishForm.description,
        linkUrl: publishForm.linkUrl,
        ctaText: publishForm.ctaText,
        hashtags: publishForm.hashtags,
        altText: publishForm.altText,
      })
    } finally {
      setIsPublishing(false)
      setPublishForm(null)
    }
  }

  return (
    <div>
      {/* Connected Accounts */}
      <div className="rounded-lg overflow-hidden mb-6" style={cardStyle}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{ fontFamily: fonts.heading, color: earth[700] }}
              className="text-lg font-semibold"
            >
              Connected Accounts
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((acc) => {
              const meta = platformMeta[acc.platform]
              return (
                <div
                  key={acc.platform}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: bg.primary, border: `1px solid ${earth[300]}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label[0]}
                    </div>
                    <div className="min-w-0">
                      <p
                        style={{ color: earth[700], fontFamily: fonts.body }}
                        className="font-medium text-sm"
                      >
                        {meta.label}
                      </p>
                      {acc.isConnected ? (
                        <p
                          style={{ color: semantic.success, fontFamily: fonts.mono }}
                          className="text-xs truncate"
                        >
                          @{acc.username}
                        </p>
                      ) : (
                        <p style={{ color: earth[400], fontFamily: fonts.body }} className="text-xs">
                          Not connected
                        </p>
                      )}
                    </div>
                  </div>
                  {acc.isConnected ? (
                    <button
                      onClick={() => handleDisconnect(acc.platform)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: semantic.error, backgroundColor: semantic.errorLight }}
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfigModal(acc.platform)}
                      className="text-xs px-2 py-1 rounded font-medium"
                      style={{ color: "white", backgroundColor: meta.color }}
                    >
                      Connect
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Publish New Post */}
      <div className="rounded-lg overflow-hidden mb-6" style={cardStyle}>
        <div className="p-5">
          <h3
            style={{ fontFamily: fonts.heading, color: earth[700] }}
            className="text-lg font-semibold mb-4"
          >
            <Send size={18} className="inline mr-2" style={{ color: primary[500] }} />
            Publish New Post
          </h3>
          <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm mb-4">
            Select a banner and platform to create a new post. Each publish creates a brand new
            post — old posts stay for organic reach.
          </p>

          {!publishForm ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts
                .filter((a) => a.isConnected)
                .map((acc) => {
                  const meta = platformMeta[acc.platform]
                  const eligibleBanners = banners.filter(
                    (b) => b.is_active && b.creatives.some((cr) => cr.ratio === meta.ratio)
                  )
                  return (
                    <button
                      key={acc.platform}
                      onClick={() => {
                        const b = eligibleBanners[0]
                        setPublishForm({
                          platform: acc.platform,
                          bannerId: b?.id || "",
                          caption: "",
                          title: b?.name || "",
                          headline: b?.headline || "",
                          description: "",
                          linkUrl: b?.cta_url || "",
                          ctaText: b?.cta_text || "",
                          hashtags: "",
                          altText: "",
                        })
                      }}
                      disabled={eligibleBanners.length === 0}
                      className="flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        backgroundColor: eligibleBanners.length > 0 ? bg.primary : "#f3f4f6",
                        border: `1px solid ${earth[300]}`,
                        opacity: eligibleBanners.length > 0 ? 1 : 0.5,
                        cursor: eligibleBanners.length > 0 ? "pointer" : "not-allowed",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label[0]}
                      </div>
                      <div>
                        <p
                          style={{ color: earth[700], fontFamily: fonts.body }}
                          className="font-medium text-sm"
                        >
                          Publish to {meta.label}
                        </p>
                        <p
                          style={{ color: earth[400], fontFamily: fonts.mono }}
                          className="text-xs"
                        >
                          {meta.ratio} &middot; {eligibleBanners.length} eligible
                        </p>
                      </div>
                    </button>
                  )
                })}
              {accounts.filter((a) => a.isConnected).length === 0 && (
                <p style={{ color: earth[400], fontFamily: fonts.body }} className="text-sm col-span-full">
                  Connect a platform above to start publishing.
                </p>
              )}
            </div>
          ) : (
            <div
              className="p-4 rounded-lg"
              style={{ backgroundColor: bg.primary, border: `1px solid ${earth[300]}` }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: platformMeta[publishForm.platform].color }}
                >
                  {platformMeta[publishForm.platform].label[0]}
                </div>
                <span
                  style={{ color: earth[700], fontFamily: fonts.heading }}
                  className="font-semibold"
                >
                  New {platformMeta[publishForm.platform].label} Post
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: primary[50],
                    color: primary[500],
                    fontFamily: fonts.mono,
                  }}
                >
                  {platformMeta[publishForm.platform].ratio}
                </span>
              </div>

              <div className="mb-3">
                <label
                  style={{ color: earth[600], fontFamily: fonts.body }}
                  className="block text-sm font-medium mb-1"
                >
                  Select Banner
                </label>
                <ThemeSelect
                  value={publishForm.bannerId}
                  onChange={(v) => {
                    const b = banners.find((bn) => bn.id === v)
                    setPublishForm({
                      ...publishForm,
                      bannerId: v,
                      title: b?.name || publishForm.title,
                      headline: b?.headline || publishForm.headline,
                      linkUrl: b?.cta_url || publishForm.linkUrl,
                      ctaText: b?.cta_text || publishForm.ctaText,
                    })
                  }}
                  options={[
                    { value: "", label: "Choose a banner..." },
                    ...banners
                      .filter(
                        (b) =>
                          b.is_active &&
                          b.creatives.some(
                            (cr) => cr.ratio === platformMeta[publishForm.platform].ratio
                          )
                      )
                      .map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  placeholder="Choose a banner..."
                />
              </div>

              {/* Rich metadata fields */}
              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    value={publishForm.title}
                    onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                    placeholder="Post title"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                  />
                </div>
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    Headline
                  </label>
                  <input
                    type="text"
                    value={publishForm.headline}
                    onChange={(e) => setPublishForm({ ...publishForm, headline: e.target.value })}
                    placeholder="Eye-catching headline"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label
                  style={{ color: earth[600], fontFamily: fonts.body }}
                  className="block text-xs font-medium mb-1"
                >
                  Caption / Body
                </label>
                <textarea
                  value={publishForm.caption}
                  onChange={(e) => setPublishForm({ ...publishForm, caption: e.target.value })}
                  rows={3}
                  placeholder="Write the post caption..."
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
                  style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                />
              </div>

              <div className="mb-3">
                <label
                  style={{ color: earth[600], fontFamily: fonts.body }}
                  className="block text-xs font-medium mb-1"
                >
                  Description / Excerpt
                </label>
                <textarea
                  value={publishForm.description}
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Short description for link previews and SEO..."
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
                  style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    Link URL
                    <span
                      style={{ color: primary[500], fontFamily: fonts.mono }}
                      className="ml-1 text-[10px]"
                    >
                      auto-filled from banner
                    </span>
                  </label>
                  <input
                    type="url"
                    value={publishForm.linkUrl}
                    onChange={(e) => setPublishForm({ ...publishForm, linkUrl: e.target.value })}
                    placeholder="https://vastucart.in/..."
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: earth[300],
                      color: earth[700],
                      fontFamily: fonts.mono,
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    CTA Text
                  </label>
                  <input
                    type="text"
                    value={publishForm.ctaText}
                    onChange={(e) => setPublishForm({ ...publishForm, ctaText: e.target.value })}
                    placeholder="Shop Now, Learn More..."
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    Hashtags
                  </label>
                  <input
                    type="text"
                    value={publishForm.hashtags}
                    onChange={(e) =>
                      setPublishForm({ ...publishForm, hashtags: e.target.value })
                    }
                    placeholder="#vastucart #sale #homedecor"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{
                      borderColor: earth[300],
                      color: earth[700],
                      fontFamily: fonts.mono,
                      fontSize: "12px",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{ color: earth[600], fontFamily: fonts.body }}
                    className="block text-xs font-medium mb-1"
                  >
                    Alt Text (accessibility)
                  </label>
                  <input
                    type="text"
                    value={publishForm.altText}
                    onChange={(e) => setPublishForm({ ...publishForm, altText: e.target.value })}
                    placeholder="Describe the image for screen readers"
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ borderColor: earth[300], color: earth[700], fontFamily: fonts.body }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePublish}
                  disabled={!publishForm.bannerId || isPublishing}
                  className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5"
                  style={{
                    backgroundColor:
                      publishForm.bannerId && !isPublishing
                        ? platformMeta[publishForm.platform].color
                        : earth[300],
                    color: "white",
                    cursor: publishForm.bannerId && !isPublishing ? "pointer" : "not-allowed",
                  }}
                >
                  {isPublishing ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Publish
                </button>
                <button
                  onClick={() => setPublishForm(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: earth[300], color: earth[700] }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Publish Log */}
      <div className="rounded-lg overflow-hidden" style={cardStyle}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3
              style={{ fontFamily: fonts.heading, color: earth[700] }}
              className="text-lg font-semibold"
            >
              Publish Log
            </h3>
            <div className="flex gap-1 flex-wrap">
              {(
                ["all", "pinterest", "instagram", "facebook", "twitter", "threads"] as const
              ).map((p) => {
                const isActive = filterPlatform === p
                const count =
                  p === "all" ? posts.length : posts.filter((post) => post.platform === p).length
                if (p !== "all" && count === 0) return null
                return (
                  <button
                    key={p}
                    onClick={() => setFilterPlatform(p)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
                    style={{
                      backgroundColor: isActive ? primary[500] : bg.primary,
                      color: isActive ? bg.card : earth[500],
                      border: `1px solid ${isActive ? primary[500] : earth[300]}`,
                    }}
                  >
                    {p === "all" ? "All" : platformMeta[p].label} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const meta = platformMeta[post.platform]
              const ps = postStatusColors[post.status]
              return (
                <div
                  key={post.id}
                  className="flex items-start justify-between gap-3 p-4 rounded-lg"
                  style={{ backgroundColor: bg.primary, border: `1px solid ${earth[300]}` }}
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold mt-0.5"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.label[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          style={{ color: earth[700], fontFamily: fonts.body }}
                          className="font-medium text-sm"
                        >
                          {post.banner_name}
                        </p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{ backgroundColor: ps?.bg, color: ps?.text }}
                        >
                          {post.status}
                        </span>
                      </div>
                      <p
                        style={{ color: earth[500], fontFamily: fonts.body }}
                        className="text-xs mt-1 line-clamp-2"
                      >
                        {post.caption}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span
                          style={{ color: earth[400], fontFamily: fonts.mono }}
                          className="text-xs"
                        >
                          {meta.label}
                        </span>
                        {post.published_at && (
                          <span
                            style={{ color: earth[400], fontFamily: fonts.mono }}
                            className="text-xs"
                          >
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        )}
                        {post.post_url && (
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1"
                            style={{ color: primary[500] }}
                          >
                            <ExternalLink size={10} />
                            View Post
                          </a>
                        )}
                        {post.meta?.linkUrl && (
                          <span
                            style={{ color: primary[400], fontFamily: fonts.mono }}
                            className="text-[10px] truncate max-w-48"
                          >
                            {post.meta.linkUrl}
                          </span>
                        )}
                      </div>
                      {post.meta?.hashtags && (
                        <p
                          style={{ color: primary[400], fontFamily: fonts.mono }}
                          className="text-[10px] mt-1"
                        >
                          {post.meta.hashtags}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8">
              <Share2 size={32} style={{ color: earth[300] }} className="mx-auto mb-2" />
              <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm">
                No posts published yet
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Config Modal */}
      {configModal && (
        <SocialConfigModal
          platform={configModal}
          onSave={onSaveSocialConfig}
          onClose={() => setConfigModal(null)}
        />
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminEcosystemAds({
  activeTab,
  banners,
  sites,
  analytics,
  analyticsSummary,
  socialAccounts,
  socialPosts,
  isLoading,
  onChangeTab,
  onCreateBanner,
  onEditBanner,
  onDeleteBanner,
  onToggleBanner,
  onCreateSite,
  onDeleteSite,
  onToggleSite,
  onCreateSlot,
  onAssignPlacement,
  onRemovePlacement,
  onSaveSocialConfig,
  onPublishToSocial,
  onFetchAnalytics,
  onUploadFile,
  onSearchProducts,
}: AdminEcosystemAdsProps) {
  return (
    <div style={{ fontFamily: fonts.body }}>
      <div className="max-w-6xl mx-auto">
        <h2
          style={{ fontFamily: fonts.heading, color: earth[700] }}
          className="text-2xl font-semibold mb-1"
        >
          Ecosystem Ads
        </h2>
        <p style={{ color: earth[500], fontFamily: fonts.body }} className="text-sm mb-6">
          Manage banners across all {sites.length} ecosystem sites and social platforms
        </p>

        {/* Tab navigation */}
        <div
          className="border-b mb-6 overflow-x-auto"
          style={{ borderColor: earth[300] }}
        >
          <div className="flex gap-1 min-w-max">
            {tabItems.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeTab(tab.id)}
                  className="flex items-center gap-2 px-4 py-2.5 font-medium text-sm transition-all border-b-2 whitespace-nowrap"
                  style={{
                    color: isActive ? primary[500] : earth[500],
                    borderColor: isActive ? primary[500] : "transparent",
                    fontFamily: fonts.body,
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin" style={{ color: primary[400] }} />
          </div>
        )}

        {/* Tab content */}
        {!isLoading && (
          <>
            {activeTab === "banners" && (
              <BannersTab
                banners={banners}
                onToggleBanner={onToggleBanner}
                onCreateBanner={onCreateBanner}
                onEditBanner={onEditBanner}
                onDeleteBanner={onDeleteBanner}
                onUploadFile={onUploadFile}
                onSearchProducts={onSearchProducts}
              />
            )}
            {activeTab === "placements" && (
              <PlacementsTab
                sites={sites}
                banners={banners}
                onToggleSite={onToggleSite}
                onDeleteSite={onDeleteSite}
                onCreateSite={onCreateSite}
                onAssign={onAssignPlacement}
                onRemove={onRemovePlacement}
                onCreateSlot={onCreateSlot}
              />
            )}
            {activeTab === "analytics" && (
              <AnalyticsTab
                summary={analyticsSummary}
                analytics={analytics}
                onFetchAnalytics={onFetchAnalytics}
              />
            )}
            {activeTab === "social" && (
              <SocialTab
                accounts={socialAccounts}
                posts={socialPosts}
                banners={banners}
                onSaveSocialConfig={onSaveSocialConfig}
                onPublishToSocial={onPublishToSocial}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
