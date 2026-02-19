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

  const token = searchParams.get("token")

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
      await resetPassword(token, newPassword)
      router.push("/login?reset=success")
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
