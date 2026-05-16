"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertCircle, Save } from "lucide-react"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"
import { captureException } from "@/lib/error-reporter"

export default function AccountProfilePage() {
  const router = useRouter()
  const { user, isLoading, refreshUser } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login?returnTo=/account/profile")
      return
    }
    const fetchCustomer = async () => {
      try {
        const { customer } = await medusa.store.customer.retrieve()
        setFirstName(customer?.first_name || "")
        setLastName(customer?.last_name || "")
        setPhone(customer?.phone || "")
      } catch (err) {
        captureException(err, { source: "profile-page:fetch" })
      } finally {
        setLoaded(true)
      }
    }
    fetchCustomer()
  }, [user, isLoading, router])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)
    try {
      await medusa.store.customer.update({
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      await refreshUser()
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || "Failed to save profile")
      captureException(err, { source: "profile-page:save" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#013f47" }} />
      </div>
    )
  }

  return (
    <div>
      <h1
        className="text-xl font-semibold mb-1"
        style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
      >
        Profile
      </h1>
      <p
        className="text-sm mb-8"
        style={{ color: "#75615a", fontFamily: "'Open Sans', sans-serif" }}
      >
        Update your name and phone number. Email changes use a separate confirmation flow.
      </p>

      <form
        onSubmit={handleSave}
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #f0ebe4",
        }}
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
        </div>
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+91 9XXXXXXXXX"
          type="tel"
        />
        <div className="text-xs" style={{ color: "#75615a" }}>
          Signed in as <strong>{user?.email}</strong>.{" "}
          <a
            href="/account/security#change-email"
            className="underline"
            style={{ color: "#013f47" }}
          >
            Change email
          </a>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 text-sm px-3 py-2 rounded"
            style={{ background: "#fef2f2", color: "#991b1b" }}
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div
            className="flex items-start gap-2 text-sm px-3 py-2 rounded"
            style={{ background: "#f0fdf4", color: "#166534" }}
          >
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Profile saved.</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span
        className="block text-xs font-medium mb-1"
        style={{ color: "#75615a", fontFamily: "'Open Sans', sans-serif" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
        style={{
          background: "#fffbf5",
          border: "1px solid #e7ddd1",
          color: "#013f47",
          fontFamily: "'Open Sans', sans-serif",
        }}
      />
    </label>
  )
}
