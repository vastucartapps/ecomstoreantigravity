"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthScreen } from "@/components/auth"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"
import type { MarketingSlide, PasswordRequirement } from "@/types/auth"

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", key: "minLength" },
  { label: "One uppercase letter", key: "uppercase" },
  { label: "One lowercase letter", key: "lowercase" },
  { label: "One number", key: "number" },
  { label: "One special character (!@#$%)", key: "special" },
]

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = useState(false)

  useEffect(() => {
    // Prefer the URL fragment (#token=…) because fragments are never sent to
    // the server in Referer headers nor recorded in server access logs. Fall
    // back to the query string for compatibility with already-issued links.
    let extracted: string | null = null
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace(/^#/, "")
      if (hash) {
        const hp = new URLSearchParams(hash)
        extracted = hp.get("token")
      }
    }
    if (!extracted) extracted = searchParams.get("token")
    setToken(extracted)
    setTokenChecked(true)

    // Scrub the token from the visible URL so it cannot leak via screen-share,
    // browser history, or Referer headers on subsequent navigations.
    if (extracted && typeof window !== "undefined") {
      window.history.replaceState({}, "", "/reset-password")
    }
  }, [searchParams])

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await medusa.client.fetch<{
          marketing_slides: MarketingSlide[]
        }>("/store/marketing-slides", { method: "GET" })
        setSlides(res.marketing_slides || [])
      } catch {}
    }
    fetchSlides()
  }, [])

  // Wait until we've checked both hash + query before deciding the link is bad
  if (!tokenChecked) return null

  // If no token, show error
  if (!token) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#fffbf5" }}
      >
        <div
          className="max-w-md w-full p-8 rounded-2xl text-center"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
            border: "1px solid #f0ebe4",
          }}
        >
          <h1
            className="text-2xl font-semibold mb-4"
            style={{ fontFamily: "'Lora', serif", color: "#013f47" }}
          >
            Invalid Reset Link
          </h1>
          <p
            className="text-sm mb-6"
            style={{
              color: "#75615a",
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <button
            onClick={() => router.push("/forgot-password")}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #013f47, #054348)" }}
          >
            Request New Link
          </button>
        </div>
      </div>
    )
  }

  const handleResetPassword = async (newPassword: string) => {
    setServerError(null)
    try {
      // resetPassword() now also performs a server-side logout so any device
      // that was still holding a JWT for this account is forced to re-auth.
      await resetPassword(token, newPassword)
      router.replace("/login?reset=success")
    } catch {
      throw new Error(
        "Failed to reset password. The link may have expired."
      )
    }
  }

  return (
    <AuthScreen
      view="reset-password"
      marketingSlides={slides}
      passwordRequirements={PASSWORD_REQUIREMENTS}
      onResetPassword={handleResetPassword}
      onNavigate={(view) => {
        if (view === "login") router.push("/login")
      }}
      serverError={serverError}
    />
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
