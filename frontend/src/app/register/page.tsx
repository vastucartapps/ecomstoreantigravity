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

export default function RegisterPage() {
  const router = useRouter()
  const { user, isAdmin, register } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>([])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) router.replace("/admin")
      else router.replace("/")
    }
  }, [user, isAdmin, router])

  // Fetch marketing slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await medusa.client.fetch<{
          marketing_slides: MarketingSlide[]
        }>("/store/marketing-slides", { method: "GET" })
        setSlides(res.marketing_slides || [])
      } catch {
        // Fallback handled by MarketingPanel
      }
    }
    fetchSlides()
  }, [])

  const handleRegister = async (
    name: string,
    email: string,
    password: string
  ) => {
    const nameParts = name.trim().split(/\s+/)
    const first_name = nameParts[0] || ""
    const last_name = nameParts.slice(1).join(" ") || ""

    try {
      await register({ email, password, first_name, last_name })
      // Redirect handled by useEffect above
    } catch (err: any) {
      if (err?.message?.includes("exists") || err?.message?.includes("duplicate")) {
        throw new Error("An account with this email already exists")
      }
      throw new Error("Registration failed. Please try again.")
    }
  }

  const handleGoogleLogin = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    window.location.href = `${backendUrl}/auth/customer/google`
  }

  return (
    <AuthScreen
      view="register"
      marketingSlides={slides}
      passwordRequirements={PASSWORD_REQUIREMENTS}
      onRegister={handleRegister}
      onGoogleLogin={handleGoogleLogin}
      onNavigate={(view) => {
        if (view === "login") router.push("/login")
      }}
    />
  )
}
