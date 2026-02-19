"use client"

import { useState, useEffect } from "react"
import { Home, Briefcase, MapPin, Plus, ArrowRight, ArrowLeft } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"
import type { AddressPayload } from "@/types/checkout"

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
]

const COUNTRIES = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "au", label: "Australia" },
  { code: "ae", label: "UAE" },
  { code: "sg", label: "Singapore" },
  { code: "ca", label: "Canada" },
]

interface AddressFormData {
  firstName: string
  lastName: string
  phone: string
  address1: string
  address2: string
  city: string
  state: string
  pincode: string
  country: string
}

const EMPTY_FORM: AddressFormData = {
  firstName: "", lastName: "", phone: "", address1: "",
  address2: "", city: "", state: "", pincode: "", country: "in",
}

export function AddressStep() {
  const { user } = useAuth()
  const { savedAddresses, loadSavedAddresses, setAddresses, selectedAddressId, setSelectedAddressId, goBack, isProcessing, error, setError } = useCheckout()
  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM)
  const [billingSame, setBillingSame] = useState(true)
  const [billingForm, setBillingForm] = useState<AddressFormData>(EMPTY_FORM)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (user) loadSavedAddresses()
    else setShowNewForm(true)
  }, [user])

  const validate = (f: AddressFormData): string | null => {
    if (!f.firstName || !f.lastName) return "Full name is required"
    if (!f.address1) return "Street address is required"
    if (!f.city) return "City is required"
    if (!f.state) return "State is required"
    if (!f.pincode) return "Pincode/ZIP is required"
    if (f.country === "in" && !/^\d{6}$/.test(f.pincode)) return "Indian pincode must be 6 digits"
    return null
  }

  const toPayload = (f: AddressFormData): AddressPayload => ({
    first_name: f.firstName,
    last_name: f.lastName,
    address_1: f.address1,
    address_2: f.address2 || undefined,
    city: f.city,
    province: f.state,
    postal_code: f.pincode,
    country_code: f.country,
    phone: f.phone || undefined,
  })

  const handleSubmitNew = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setError(null)
    const err = validate(form)
    if (err) { setLocalError(err); return }
    const shipping = toPayload(form)
    const billing = billingSame ? undefined : toPayload(billingForm)
    try {
      await setAddresses(shipping, billing)
    } catch {}
  }

  const handleUseSaved = async () => {
    if (!selectedAddressId) { setLocalError("Please select a delivery address"); return }
    const addr = savedAddresses.find((a) => a.id === selectedAddressId)
    if (!addr) return
    setLocalError(null)
    try {
      await setAddresses({
        first_name: addr.first_name || addr.name?.split(" ")[0] || "",
        last_name: addr.last_name || addr.name?.split(" ").slice(1).join(" ") || "",
        address_1: addr.address_1 || addr.street || "",
        address_2: addr.address_2 || "",
        city: addr.city || "",
        province: addr.province || addr.state || "",
        postal_code: addr.postal_code || addr.pincode || "",
        country_code: addr.country_code || "in",
        phone: addr.phone || "",
      })
    } catch {}
  }

  const displayError = localError || error

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
  const inputStyle = { border: "1.5px solid #e8e0d8", color: earth[700], fontFamily: fonts.body, background: bg.card }

  const AddressFormFields = ({ data, onChange }: { data: AddressFormData; onChange: (d: AddressFormData) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>First Name *</label>
        <input className={inputCls} style={inputStyle} value={data.firstName} onChange={(e) => onChange({ ...data, firstName: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>Last Name *</label>
        <input className={inputCls} style={inputStyle} value={data.lastName} onChange={(e) => onChange({ ...data, lastName: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>Phone</label>
        <input className={inputCls} style={inputStyle} type="tel" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder="+91 98765 43210"
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>Country *</label>
        <select className={inputCls} style={inputStyle} value={data.country} onChange={(e) => onChange({ ...data, country: e.target.value })}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>Street Address *</label>
        <input className={inputCls} style={inputStyle} value={data.address1} placeholder="House no., Street name, Area"
          onChange={(e) => onChange({ ...data, address1: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>Apt / Floor / Landmark <span style={{ color: earth[300] }}>(optional)</span></label>
        <input className={inputCls} style={inputStyle} value={data.address2} onChange={(e) => onChange({ ...data, address2: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>City *</label>
        <input className={inputCls} style={inputStyle} value={data.city} onChange={(e) => onChange({ ...data, city: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
      {data.country === "in" ? (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>State *</label>
          <select className={inputCls} style={inputStyle} value={data.state} onChange={(e) => onChange({ ...data, state: e.target.value })}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>State / Province *</label>
          <input className={inputCls} style={inputStyle} value={data.state} onChange={(e) => onChange({ ...data, state: e.target.value })}
            onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
          {data.country === "in" ? "Pincode *" : "ZIP / Postal Code *"}
        </label>
        <input className={inputCls} style={inputStyle} value={data.pincode} maxLength={data.country === "in" ? 6 : 10}
          onChange={(e) => onChange({ ...data, pincode: e.target.value })}
          onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])} onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")} />
      </div>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Saved addresses */}
      {user && savedAddresses.length > 0 && !showNewForm && (
        <>
          <div className="space-y-2.5">
            {savedAddresses.map((addr) => (
              <label
                key={addr.id}
                className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  border: `1.5px solid ${selectedAddressId === addr.id ? primary[500] : "#e8e0d8"}`,
                  background: selectedAddressId === addr.id ? primary[50] : bg.card,
                }}
              >
                <input
                  type="radio"
                  name="address"
                  value={addr.id}
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1 flex-shrink-0"
                  style={{ accentColor: primary[500] }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {addr.label === "Home" || !addr.label ? <Home className="w-3.5 h-3.5" style={{ color: earth[400] }} /> : <Briefcase className="w-3.5 h-3.5" style={{ color: earth[400] }} />}
                    <span className="text-xs font-semibold" style={{ color: earth[600] }}>{addr.label || "Home"}</span>
                    {addr.is_default && <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: primary[500] }}>Default</span>}
                  </div>
                  <p className="text-sm font-medium" style={{ color: earth[700] }}>
                    {addr.first_name || addr.name} {addr.last_name || ""}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: earth[400] }}>
                    {addr.address_1 || addr.street}, {addr.city}, {addr.province || addr.state} {addr.postal_code || addr.pincode}
                  </p>
                  {addr.phone && <p className="text-xs" style={{ color: earth[400] }}>{addr.phone}</p>}
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={() => { setShowNewForm(true); setSelectedAddressId(null) }}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: primary[500] }}
          >
            <Plus className="w-4 h-4" /> Add New Address
          </button>

          {displayError && <p className="text-sm px-4 py-2.5 rounded-lg" style={{ color: "#EF4444", background: "#FEF2F2" }}>{displayError}</p>}

          <div className="flex gap-3">
            <button onClick={goBack} className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={handleUseSaved} disabled={isProcessing || !selectedAddressId}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}>
              {isProcessing ? "Saving..." : <>Continue to Shipping <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </>
      )}

      {/* New address form */}
      {(showNewForm || !user || savedAddresses.length === 0) && (
        <form onSubmit={handleSubmitNew} className="space-y-5">
          <AddressFormFields data={form} onChange={setForm} />

          {/* Billing address */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)}
              style={{ accentColor: primary[500] }} />
            <span className="text-sm" style={{ color: earth[600] }}>Billing address same as shipping</span>
          </label>

          {!billingSame && (
            <div>
              <h4 className="text-sm font-semibold mb-3" style={{ color: earth[700] }}>Billing Address</h4>
              <AddressFormFields data={billingForm} onChange={setBillingForm} />
            </div>
          )}

          {displayError && <p className="text-sm px-4 py-2.5 rounded-lg" style={{ color: "#EF4444", background: "#FEF2F2" }}>{displayError}</p>}

          <div className="flex gap-3">
            {user && savedAddresses.length > 0 && (
              <button type="button" onClick={() => setShowNewForm(false)}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {!user && (
              <button type="button" onClick={goBack}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button type="submit" disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}>
              {isProcessing ? "Saving..." : <>Continue to Shipping <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
