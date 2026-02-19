"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { user, forgotPassword } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>([])

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace("/")
  }, [user, router])

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

  const handleForgotPassword = async (email: string) => {
    await forgotPassword(email)
    // Success message is shown by the AuthScreen component
  }

  return (
    <AuthScreen
      view="forgot-password"
      marketingSlides={slides}
      passwordRequirements={PASSWORD_REQUIREMENTS}
      onForgotPassword={handleForgotPassword}
      onNavigate={(view) => {
        if (view === "login") router.push("/login")
      }}
    />
  )
}
