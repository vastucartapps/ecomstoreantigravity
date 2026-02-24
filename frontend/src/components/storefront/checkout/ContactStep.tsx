"use client"

import { useState, useEffect } from "react"
import { Mail, Phone, ArrowRight, LogIn } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/providers/auth-provider"
import { useCheckout } from "@/providers/checkout-provider"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

const COUNTRY_CODES = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
]

export function ContactStep() {
  const { user } = useAuth()
  const { contactEmail, contactPhone, submitContact, isProcessing, error, setError } = useCheckout()

  const [email, setEmail] = useState(contactEmail || user?.email || "")
  const [phone, setPhone] = useState(contactPhone || "")
  const [countryCode, setCountryCode] = useState("+91")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email)
  }, [user])

  const isIndian = countryCode === "+91"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setError(null)
    if (!email.trim() || !email.includes("@")) {
      setLocalError("Please enter a valid email address")
      return
    }
    if (isIndian && !phone.trim()) {
      setLocalError("Phone number is required for delivery to India")
      return
    }
    try {
      await submitContact(email.trim(), phone.trim(), countryCode)
    } catch {}
  }

  const displayError = localError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Logged in notice */}
      {user ? (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: primary[50], border: `1px solid ${primary[100]}` }}
        >
          <LogIn className="w-4 h-4 flex-shrink-0" style={{ color: primary[500] }} />
          <span style={{ color: earth[700], fontFamily: fonts.body }}>
            Logged in as <strong>{user.email}</strong>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm" style={{ color: earth[400] }}>
          <span style={{ fontFamily: fonts.body }}>Already have an account?</span>
          <Link
            href="/login?returnTo=/checkout"
            className="font-semibold transition-colors"
            style={{ color: primary[500] }}
          >
            Log in
          </Link>
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
          Email Address <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
            style={{
              border: `1.5px solid #e8e0d8`,
              color: earth[700],
              fontFamily: fonts.body,
              background: bg.card,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            required
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: earth[300] }}>
          Order confirmation will be sent to this email
        </p>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
          Phone Number
          {isIndian ? (
            <span className="ml-1" style={{ color: "#EF4444" }}>*</span>
          ) : (
            <span className="ml-1.5 font-normal text-[11px]" style={{ color: earth[300] }}>(optional)</span>
          )}
        </label>
        <div className="flex gap-2">
          <ThemeSelect
            value={countryCode}
            onChange={(v) => setCountryCode(v)}
            options={COUNTRY_CODES.map((c) => ({ value: c.code, label: `${c.flag} ${c.code}` }))}
            style={{ width: 100, flexShrink: 0 }}
          />
          <div className="flex-1 relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: earth[300] }} />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isIndian ? "98765 43210" : "+1 555 000 0000"}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                border: `1.5px solid #e8e0d8`,
                color: earth[700],
                fontFamily: fonts.body,
                background: bg.card,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
          </div>
        </div>
        {!isIndian && (
          <p className="text-xs mt-1.5" style={{ color: "#F59E0B" }}>
            Phone recommended for international delivery coordination
          </p>
        )}
      </div>

      {displayError && (
        <p className="text-sm px-4 py-2.5 rounded-lg" style={{ color: "#EF4444", background: "#FEF2F2" }}>
          {displayError}
        </p>
      )}

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
      >
        {isProcessing ? "Saving..." : "Continue to Address"}
        {!isProcessing && <ArrowRight className="w-4 h-4" />}
      </button>
    </form>
  )
}
