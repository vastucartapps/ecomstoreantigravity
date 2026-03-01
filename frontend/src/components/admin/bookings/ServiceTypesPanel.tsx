"use client"

import { useState, useRef } from "react"
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X, Upload, ChevronLeft, ChevronRight, Link2, Copy } from "lucide-react"
import type { AdminBookingServiceType } from "@/types/admin-booking"
import { normalizeImageUrl } from "@/lib/image-url"

const c = {
  primary500: "#013f47",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  border: "#e8e0d8",
  earth700: "#3d2c1e",
  earth600: "#5c4433",
  earth400: "#9a7c68",
  earth300: "#b89b8a",
  earth100: "#f0ebe4",
}

const EMPTY_FORM: Omit<AdminBookingServiceType, "id" | "created_at"> = {
  title: "",
  description: "",
  duration_minutes: 45,
  price: 0,
  currency: "INR",
  is_active: true,
  display_order: 0,
  image_1: "",
  image_2: "",
  image_3: "",
  what_is_included: "",
  outcomes: "",
  mode: "online",
  badge_text: "",
}

const ECOSYSTEM_API_URL = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in"}/store/bookings/service-types`
const CONSULTATION_PAGE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"}/consultations`

interface Props {
  serviceTypes: AdminBookingServiceType[]
  onAdd: (data: Omit<AdminBookingServiceType, "id" | "created_at">) => Promise<void>
  onUpdate: (id: string, data: Partial<Omit<AdminBookingServiceType, "id" | "created_at">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, is_active: boolean) => Promise<void>
  onUploadFile: (file: File) => Promise<string>
}

/** Parse what_is_included JSON into string[] */
function parseIncluded(raw: string): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return raw.split("\n").filter(Boolean) }
}

/** Carousel component for showing service type images in the list */
function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const validImages = images.filter(Boolean)
  if (validImages.length === 0) return null
  return (
    <div className="relative flex-shrink-0" style={{ width: 64, height: 64, borderRadius: 10, overflow: "hidden", background: c.earth100 }}>
      <img
        src={normalizeImageUrl(validImages[idx])}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
      {validImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + validImages.length) % validImages.length) }}
            className="absolute left-0 top-0 h-full px-0.5 flex items-center"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <ChevronLeft className="w-3 h-3 text-white" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % validImages.length) }}
            className="absolute right-0 top-0 h-full px-0.5 flex items-center"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            <ChevronRight className="w-3 h-3 text-white" />
          </button>
          <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
            {validImages.map((_, i) => (
              <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Single image upload slot */
function ImageSlot({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  onUpload: (file: File) => Promise<string>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>{label}</label>
      {value ? (
        <div className="relative" style={{ borderRadius: 10, overflow: "hidden", height: 90, background: c.earth100 }}>
          <img
            src={normalizeImageUrl(value)}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,0.55)" }}
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex flex-col items-center justify-center gap-1 rounded-xl border-dashed text-xs font-semibold transition-opacity disabled:opacity-50"
          style={{ height: 90, border: `2px dashed ${c.border}`, color: c.earth400, background: c.bg }}
        >
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}

export function ServiceTypesPanel({ serviceTypes, onAdd, onUpdate, onDelete, onToggleActive, onUploadFile }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copiedApi, setCopiedApi] = useState(false)
  const [copiedPage, setCopiedPage] = useState(false)

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (type: AdminBookingServiceType) => {
    setForm({
      title: type.title,
      description: type.description,
      duration_minutes: type.duration_minutes,
      price: type.price,
      currency: type.currency,
      is_active: type.is_active,
      display_order: type.display_order,
      image_1: type.image_1 || "",
      image_2: type.image_2 || "",
      image_3: type.image_3 || "",
      what_is_included: type.what_is_included || "",
      outcomes: type.outcomes || "",
      mode: type.mode || "online",
      badge_text: type.badge_text || "",
    })
    setEditingId(type.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await onUpdate(editingId, form)
      } else {
        await onAdd(form)
      }
      setShowForm(false)
      setEditingId(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try { await onDelete(id) } finally { setDeletingId(null) }
  }

  const copyText = async (text: string, which: "api" | "page") => {
    await navigator.clipboard.writeText(text)
    if (which === "api") { setCopiedApi(true); setTimeout(() => setCopiedApi(false), 2000) }
    else { setCopiedPage(true); setTimeout(() => setCopiedPage(false), 2000) }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 10,
    border: `1.5px solid ${c.border}`,
    fontSize: 13,
    color: c.earth700,
    background: c.bg,
    outline: "none",
    boxSizing: "border-box",
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold" style={{ color: c.earth700 }}>Consultation Services</h3>
          <p className="text-xs mt-0.5" style={{ color: c.earth400 }}>
            Only active services are visible to customers for booking
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white"
          style={{ background: c.primary500 }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Service
        </button>
      </div>

      {/* Ecosystem API Integration Info */}
      <div className="mb-5 rounded-2xl p-4 space-y-2" style={{ background: c.primary50, border: `1px solid ${c.primary100}` }}>
        <div className="flex items-center gap-1.5 mb-1">
          <Link2 className="w-3.5 h-3.5" style={{ color: c.primary500 }} />
          <span className="text-xs font-bold" style={{ color: c.primary500 }}>Ecosystem Integration</span>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: c.earth600 }}>Public API — embed consultation data on any website:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs px-2 py-1.5 rounded-lg truncate" style={{ background: "rgba(1,63,71,0.08)", color: c.primary500 }}>
              {ECOSYSTEM_API_URL}
            </code>
            <button
              onClick={() => copyText(ECOSYSTEM_API_URL, "api")}
              className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: c.primary500 }}
              title="Copy API URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copiedApi && <span className="text-xs" style={{ color: "#10B981" }}>Copied!</span>}
          </div>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: c.earth600 }}>Consultation landing page (link customers here):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs px-2 py-1.5 rounded-lg truncate" style={{ background: "rgba(1,63,71,0.08)", color: c.primary500 }}>
              {CONSULTATION_PAGE_URL}
            </code>
            <button
              onClick={() => copyText(CONSULTATION_PAGE_URL, "page")}
              className="flex-shrink-0 p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: c.primary500 }}
              title="Copy page URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {copiedPage && <span className="text-xs" style={{ color: "#10B981" }}>Copied!</span>}
          </div>
        </div>
      </div>

      {/* List */}
      {serviceTypes.length === 0 ? (
        <div
          className="py-10 text-center rounded-2xl"
          style={{ background: c.earth100, border: `1.5px dashed ${c.border}` }}
        >
          <p className="text-sm font-medium" style={{ color: c.earth600 }}>No services yet</p>
          <p className="text-xs mt-1" style={{ color: c.earth400 }}>
            Add consultation types — customers can only book active services
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {serviceTypes
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
            .map((type) => (
              <div
                key={type.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: type.is_active ? c.card : "#f9f6f2",
                  border: `1px solid ${type.is_active ? c.border : "#e0d8d0"}`,
                  opacity: type.is_active ? 1 : 0.75,
                }}
              >
                <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: c.earth300 }} />

                {/* Image thumbnail carousel */}
                <ImageCarousel images={[type.image_1, type.image_2, type.image_3]} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: c.earth700 }}>{type.title}</p>
                    {type.badge_text && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                        style={{ background: c.secondary50, color: c.secondary500 }}
                      >
                        {type.badge_text}
                      </span>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: type.is_active ? "#ECFDF5" : "#F3F4F6",
                        color: type.is_active ? "#10B981" : "#6B7280",
                        fontWeight: 600,
                      }}
                    >
                      {type.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  {type.description && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: c.earth400 }}>{type.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: c.earth400 }}>{type.duration_minutes} min</span>
                    <span className="text-xs capitalize" style={{ color: c.earth400 }}>{type.mode}</span>
                    {type.price > 0 && (
                      <span className="text-xs font-semibold" style={{ color: c.primary500 }}>
                        ₹{type.price.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => onToggleActive(type.id, !type.is_active)}
                    className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    title={type.is_active ? "Hide from customers" : "Show to customers"}
                    style={{ color: type.is_active ? "#10B981" : c.earth400 }}
                  >
                    {type.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(type)}
                    className="p-1.5 rounded-lg hover:opacity-70 transition-opacity"
                    title="Edit"
                    style={{ color: c.earth400 }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(type.id)}
                    disabled={deletingId === type.id}
                    className="p-1.5 rounded-lg hover:opacity-70 transition-opacity disabled:opacity-30"
                    title="Delete"
                    style={{ color: "#EF4444" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: c.card, maxHeight: "92vh", overflowY: "auto" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{ borderBottom: `1px solid ${c.border}`, background: c.card }}
            >
              <h3 className="text-sm font-bold" style={{ color: c.earth700 }}>
                {editingId ? "Edit Consultation Service" : "New Consultation Service"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:opacity-70"
                style={{ color: c.earth400 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Images */}
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: c.earth600 }}>
                  Carousel Images (up to 3)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <ImageSlot
                    label="Image 1"
                    value={form.image_1}
                    onChange={(url) => setForm({ ...form, image_1: url })}
                    onUpload={onUploadFile}
                  />
                  <ImageSlot
                    label="Image 2"
                    value={form.image_2}
                    onChange={(url) => setForm({ ...form, image_2: url })}
                    onUpload={onUploadFile}
                  />
                  <ImageSlot
                    label="Image 3"
                    value={form.image_3}
                    onChange={(url) => setForm({ ...form, image_3: url })}
                    onUpload={onUploadFile}
                  />
                </div>
              </div>

              <hr style={{ borderColor: c.border }} />

              {/* Title + Badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Home Vastu Consultation"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Badge Label</label>
                  <input
                    type="text"
                    value={form.badge_text}
                    onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                    placeholder="e.g. Most Popular"
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description shown to customers"
                  rows={2}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                  What&apos;s Included
                  <span className="font-normal ml-1" style={{ color: c.earth400 }}>(one item per line)</span>
                </label>
                <textarea
                  value={parseIncluded(form.what_is_included).join("\n")}
                  onChange={(e) => {
                    const items = e.target.value.split("\n").filter(Boolean)
                    setForm({ ...form, what_is_included: JSON.stringify(items) })
                  }}
                  placeholder={"Property site analysis\nPersonalized Vastu report\n30-day email follow-up"}
                  rows={3}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              {/* Outcomes */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Outcomes / What You Get</label>
                <textarea
                  value={form.outcomes}
                  onChange={(e) => setForm({ ...form, outcomes: e.target.value })}
                  placeholder="A detailed Vastu report + remedies + 1 follow-up call"
                  rows={2}
                  style={{ ...inputStyle, resize: "none" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              {/* Duration + Price + Mode */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Duration (min)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Mode</label>
                  <select
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value as "online" | "offline" | "both" })}
                    style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  >
                    <option value="online">Online</option>
                    <option value="offline">In-Person</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              {/* Sort Order + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>Sort Order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    style={inputStyle}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-xs font-semibold" style={{ color: c.earth600 }}>
                      Active (visible to customers)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ border: `1.5px solid ${c.border}`, color: c.earth600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: c.primary500 }}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
