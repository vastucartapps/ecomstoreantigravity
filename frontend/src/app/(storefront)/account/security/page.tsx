"use client"

import { useState } from "react"
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { SessionManager } from "@/components/auth/SessionManager"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

export default function AccountSecurityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-xl font-semibold mb-1"
          style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
        >
          Security
        </h1>
        <p
          className="text-sm"
          style={{
            color: "#75615a",
            fontFamily: "'Open Sans', sans-serif",
          }}
        >
          Manage your password, email, and active sessions
        </p>
      </div>

      <Card>
        <CardHeading
          icon={<Lock className="w-4 h-4" />}
          title="Change password"
          subtitle="Use 8+ characters with a mix of letters, numbers, and symbols"
        />
        <PasswordChangeForm />
      </Card>

      <Card id="change-email">
        <CardHeading
          icon={<Mail className="w-4 h-4" />}
          title="Change email"
          subtitle="We'll send a confirmation link to the new address — the change takes effect once you click it"
        />
        <EmailChangeForm />
      </Card>

      <Card>
        <SessionManager />
      </Card>
    </div>
  )
}

function Card({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div
      id={id}
      className="rounded-2xl p-6"
      style={{
        background: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        border: "1px solid #f0ebe4",
      }}
    >
      {children}
    </div>
  )
}

function CardHeading({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: "#f5f0ea", color: "#013f47" }}
      >
        {icon}
      </div>
      <div>
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
        >
          {title}
        </h2>
        <p className="text-xs" style={{ color: "#75615a" }}>
          {subtitle}
        </p>
      </div>
    </div>
  )
}

function PasswordChangeForm() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match")
      return
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${BACKEND_URL}/store/customers/me/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("medusa_auth_token") || "" : ""}`,
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.message || "Failed to change password")
      setSuccess(true)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setError(err?.message || "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="Current password"
        type="password"
        value={oldPassword}
        onChange={setOldPassword}
        autoComplete="current-password"
      />
      <Field
        label="New password"
        type="password"
        value={newPassword}
        onChange={setNewPassword}
        autoComplete="new-password"
      />
      <Field
        label="Confirm new password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />
      {error && <Alert variant="error">{error}</Alert>}
      {success && (
        <Alert variant="success">
          Password updated. All other devices have been signed out.
        </Alert>
      )}
      <SubmitButton saving={saving}>Update password</SubmitButton>
    </form>
  )
}

function EmailChangeForm() {
  const { user } = useAuth()
  const [newEmail, setNewEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSentTo(null)
    setSaving(true)
    try {
      const res = await medusa.client.fetch<{ success: boolean; sent_to?: string; message?: string }>(
        "/store/customers/me/change-email",
        {
          method: "POST",
          body: { new_email: newEmail.trim() },
        }
      )
      if (!res?.success) throw new Error(res?.message || "Failed to start change")
      setSentTo(res.sent_to || newEmail.trim())
      setNewEmail("")
    } catch (err: any) {
      setError(err?.message || "Failed to start email change")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-xs" style={{ color: "#75615a" }}>
        Current email: <strong>{user?.email || "—"}</strong>
      </div>
      <Field
        label="New email"
        type="email"
        value={newEmail}
        onChange={setNewEmail}
        autoComplete="email"
      />
      {error && <Alert variant="error">{error}</Alert>}
      {sentTo && (
        <Alert variant="success">
          Confirmation link sent to <strong>{sentTo}</strong>. Click the link in that
          email to complete the change. The change isn't active until you do.
        </Alert>
      )}
      <SubmitButton saving={saving}>Send confirmation link</SubmitButton>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
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
        autoComplete={autoComplete}
        required
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

function SubmitButton({
  saving,
  children,
}: {
  saving: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
    >
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

function Alert({
  variant,
  children,
}: {
  variant: "error" | "success"
  children: React.ReactNode
}) {
  const palette =
    variant === "error"
      ? { bg: "#fef2f2", fg: "#991b1b", Icon: AlertCircle }
      : { bg: "#f0fdf4", fg: "#166534", Icon: CheckCircle2 }
  const Icon = palette.Icon
  return (
    <div
      className="flex items-start gap-2 text-sm px-3 py-2 rounded"
      style={{ background: palette.bg, color: palette.fg }}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </div>
  )
}
