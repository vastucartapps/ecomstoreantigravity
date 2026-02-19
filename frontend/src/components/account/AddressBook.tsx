"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, Loader2, X } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { Address } from "@/types/dashboard"

const COUNTRY_OPTIONS = [
  { code: "in", name: "India" },
  { code: "us", name: "United States" },
  { code: "gb", name: "United Kingdom" },
  { code: "ae", name: "UAE" },
  { code: "sg", name: "Singapore" },
]

const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
  "Puducherry","Chandigarh","Dadra and Nagar Haveli","Daman and Diu","Lakshadweep","Andaman and Nicobar",
]

interface AddressFormData {
  name: string
  phone: string
  street: string
  city: string
  state: string
  pincode: string
  country: string
  label: string
}

const emptyForm: AddressFormData = {
  name: "", phone: "", street: "", city: "", state: "", pincode: "", country: "in", label: "Home",
}

export function AddressBook() {
  const { fetchAddresses, createAddress, updateAddress, deleteAddress } = useDashboardData()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    try {
      const addrs = await fetchAddresses()
      setAddresses(addrs)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setShowForm(true)
  }

  const handleEdit = (addr: Address) => {
    setEditingId(addr.id)
    setForm({
      name: addr.name,
      phone: addr.phone || "",
      street: addr.street,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country.toLowerCase(),
      label: addr.label || "Home",
    })
    setError(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.street || !form.city || !form.state || !form.pincode) {
      setError("Please fill in all required fields")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editingId) {
        await updateAddress(editingId, form)
      } else {
        await createAddress(form)
      }
      await load()
      setShowForm(false)
    } catch (err: any) {
      setError(err?.message || "Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await deleteAddress(id)
      await load()
    } catch (err: any) {
      setError(err?.message || "Failed to delete address")
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const inputStyle = {
    border: "1.5px solid #e8e0d8",
    color: earth[700],
    fontFamily: fonts.body,
    background: bg.card,
    borderRadius: "10px",
    padding: "10px 14px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
            Address Book
          </h1>
          <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
            Manage your delivery addresses
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: primary[500] }}
        >
          <Plus className="w-4 h-4" />
          Add Address
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#EF4444" }}>
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: bg.card, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f0ebe4" }}>
              <h2 className="text-base font-semibold" style={{ color: earth[700], fontFamily: fonts.heading }}>
                {editingId ? "Edit Address" : "Add New Address"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: earth[400] }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>Full Name *</label>
                  <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>Phone</label>
                  <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>Street Address *</label>
                <input style={inputStyle} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="123, Main Street, Apartment 4B" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>City *</label>
                  <input style={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>State *</label>
                  {form.country === "in" ? (
                    <select style={{ ...inputStyle, appearance: "none" }} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>
                      <option value="">Select state</option>
                      {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input style={inputStyle} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>PIN Code *</label>
                  <input style={inputStyle} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="400001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>Country</label>
                  <select style={{ ...inputStyle, appearance: "none" }} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                    {COUNTRY_OPTIONS.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: earth[600] }}>Label</label>
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map((l) => (
                    <button
                      key={l}
                      onClick={() => setForm({ ...form, label: l })}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: form.label === l ? primary[500] : "#f0ebe4",
                        color: form.label === l ? "#fff" : earth[600],
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: primary[500] }}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Address"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: bg.card }}>
            <h3 className="text-base font-semibold mb-2" style={{ color: earth[700] }}>Delete Address?</h3>
            <p className="text-sm mb-5" style={{ color: earth[400] }}>This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm" style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={!!deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#EF4444" }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <MapPin className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
          <p className="text-sm font-medium" style={{ color: earth[500] }}>No addresses saved</p>
          <button onClick={handleAdd} className="mt-3 text-sm font-medium" style={{ color: primary[500] }}>
            + Add your first address
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="rounded-2xl p-4"
              style={{ background: bg.card, border: `1.5px solid ${addr.isDefault ? primary[300] : "#f0ebe4"}` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {addr.label && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${primary[50]}`, color: primary[500] }}>
                      {addr.label}
                    </span>
                  )}
                  {addr.isDefault && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle2 className="w-3 h-3" /> Default
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(addr)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: primary[500] }}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteConfirm(addr.id)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "#EF4444" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: earth[700] }}>{addr.name}</p>
              {addr.phone && <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{addr.phone}</p>}
              <p className="text-xs mt-1 leading-relaxed" style={{ color: earth[500] }}>
                {addr.street}, {addr.city}, {addr.state} — {addr.pincode}, {addr.country}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
