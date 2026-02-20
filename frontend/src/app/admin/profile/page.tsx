"use client"

import { useState, useEffect } from "react"
import { medusa, adminFetch } from "@/lib/medusa"
import { primary, earth, fonts } from "@/lib/theme"
import { User, Mail, Lock, Save, CheckCircle, XCircle } from "lucide-react"

interface AdminUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string
  avatar_url: string | null
}

const c = {
  card: "#ffffff",
  border: "#f0ebe4",
  bg: "#fffbf5",
  label: earth[600] || "#5a4f47",
  muted: earth[400],
  primary: primary[500],
  primary50: "#e8f5f3",
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  readOnly = false,
  placeholder = "",
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          fontSize: "13px",
          fontWeight: 600,
          color: c.label,
          marginBottom: "6px",
          fontFamily: fonts.body,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "9px 12px",
          border: `1px solid ${readOnly ? "#e8e0d8" : c.border}`,
          borderRadius: "8px",
          fontSize: "14px",
          fontFamily: fonts.body,
          color: readOnly ? c.muted : earth[700] || "#3d3028",
          background: readOnly ? "#faf7f3" : "#fff",
          outline: "none",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          if (!readOnly) e.target.style.borderColor = c.primary
        }}
        onBlur={(e) => {
          if (!readOnly) e.target.style.borderColor = c.border
        }}
      />
    </div>
  )
}

function Toast({
  msg,
  ok,
}: {
  msg: string
  ok: boolean
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 18px",
        borderRadius: "8px",
        background: ok ? "#013f47" : "#dc2626",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
      }}
    >
      {ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {msg}
    </div>
  )
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    medusa.client
      .fetch<{ user: any }>("/admin/users/me")
      .then(({ user: u }) => {
        setUser({
          id: u.id,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email,
          avatar_url: u.avatar_url || null,
        })
        setFirstName(u.first_name || "")
        setLastName(u.last_name || "")
      })
      .catch(() => {})
  }, [])

  const handleSaveProfile = async () => {
    if (!user) return
    setIsSavingProfile(true)
    try {
      await medusa.client.fetch(`/admin/users/${user.id}`, {
        method: "POST",
        body: { first_name: firstName, last_name: lastName },
      })
      setUser((prev) => prev ? { ...prev, first_name: firstName, last_name: lastName } : prev)
      showToast("Profile updated")
    } catch {
      showToast("Failed to update profile", false)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required", false)
      return
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", false)
      return
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", false)
      return
    }
    setIsSavingPassword(true)
    try {
      await adminFetch("/admin/users/me/password", {
        method: "POST",
        body: { old_password: oldPassword, new_password: newPassword },
      })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
      showToast("Password changed successfully")
    } catch (e: any) {
      showToast(e?.message || "Failed to change password", false)
    } finally {
      setIsSavingPassword(false)
    }
  }

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((n) => n[0].toUpperCase())
    .join("") || "A"

  return (
    <div style={{ maxWidth: "560px", fontFamily: fonts.body }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "26px",
            fontWeight: 700,
            color: earth[700] || "#3d3028",
            margin: 0,
          }}
        >
          My Profile
        </h1>
        <p style={{ color: c.muted, fontSize: "14px", marginTop: "4px" }}>
          Manage your admin account details and password
        </p>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: `${c.primary}20`,
            border: `2px solid ${c.primary}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: 700,
            color: c.primary,
            fontFamily: fonts.heading,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: "16px", color: earth[700] || "#3d3028" }}>
            {[firstName, lastName].filter(Boolean).join(" ") || "Admin User"}
          </div>
          <div style={{ fontSize: "13px", color: c.muted }}>{user?.email ?? ""}</div>
        </div>
      </div>

      {/* Profile card */}
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <User size={17} color={c.primary} />
          <span style={{ fontWeight: 700, fontSize: "15px", color: earth[700] || "#3d3028" }}>
            Personal Details
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            placeholder="First name"
          />
          <Field
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            placeholder="Last name"
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "6px",
            }}
          >
            <Mail size={13} color={c.muted} />
            <label
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: c.label,
                fontFamily: fonts.body,
              }}
            >
              Email (read-only)
            </label>
          </div>
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            style={{
              width: "100%",
              padding: "9px 12px",
              border: `1px solid #e8e0d8`,
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: fonts.body,
              color: c.muted,
              background: "#faf7f3",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <p style={{ fontSize: "12px", color: c.muted, marginTop: "4px" }}>
            Email cannot be changed here. Contact your hosting provider.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 20px",
              background: isSavingProfile ? "#ccc" : c.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isSavingProfile ? "not-allowed" : "pointer",
              fontFamily: fonts.body,
            }}
          >
            <Save size={15} />
            {isSavingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>

      {/* Password card */}
      <div
        style={{
          background: c.card,
          border: `1px solid ${c.border}`,
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <Lock size={17} color={c.primary} />
          <span style={{ fontWeight: 700, fontSize: "15px", color: earth[700] || "#3d3028" }}>
            Change Password
          </span>
        </div>

        <Field
          label="Current Password"
          value={oldPassword}
          onChange={setOldPassword}
          type="password"
          placeholder="Enter current password"
        />
        <Field
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
          placeholder="Minimum 8 characters"
        />
        <Field
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          placeholder="Repeat new password"
        />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <button
            onClick={handleSavePassword}
            disabled={isSavingPassword}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 20px",
              background: isSavingPassword ? "#ccc" : c.primary,
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isSavingPassword ? "not-allowed" : "pointer",
              fontFamily: fonts.body,
            }}
          >
            <Lock size={15} />
            {isSavingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  )
}
