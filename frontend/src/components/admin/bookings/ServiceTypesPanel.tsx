"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Save, X } from "lucide-react"
import type { AdminBookingServiceType } from "@/types/admin-booking"

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
}

interface Props {
  serviceTypes: AdminBookingServiceType[]
  onAdd: (data: Omit<AdminBookingServiceType, "id" | "created_at">) => Promise<void>
  onUpdate: (id: string, data: Partial<Omit<AdminBookingServiceType, "id" | "created_at">>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onToggleActive: (id: string, is_active: boolean) => Promise<void>
}

export function ServiceTypesPanel({ serviceTypes, onAdd, onUpdate, onDelete, onToggleActive }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: c.earth700 }}>{type.title}</p>
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
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: c.card, maxHeight: "90vh", overflowY: "auto" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: `1px solid ${c.border}` }}
            >
              <h3 className="text-sm font-bold" style={{ color: c.earth700 }}>
                {editingId ? "Edit Service" : "New Service"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg hover:opacity-70"
                style={{ color: c.earth400 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Home Vastu Consultation"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ border: `1.5px solid ${c.border}`, color: c.earth700, background: c.bg }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description shown to customers"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ border: `1.5px solid ${c.border}`, color: c.earth700, background: c.bg }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                />
              </div>

              {/* Duration + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                    Duration (min)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={form.duration_minutes}
                    onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: `1.5px solid ${c.border}`, color: c.earth700, background: c.bg }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: `1.5px solid ${c.border}`, color: c.earth700, background: c.bg }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = c.primary500)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = c.border)}
                  />
                </div>
              </div>

              {/* Display Order + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: c.earth600 }}>
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ border: `1.5px solid ${c.border}`, color: c.earth700, background: c.bg }}
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
