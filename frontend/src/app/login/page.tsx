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

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin, login, register } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>([])
  const [serverError, setServerError] = useState<string | null>(null)

  const returnTo = searchParams.get("returnTo")

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        router.replace("/admin")
      } else {
        router.replace(returnTo || "/")
      }
    }
  }, [user, isAdmin, router, returnTo])

  // Fetch marketing slides
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await medusa.client.fetch<{
          marketing_slides: MarketingSlide[]
        }>("/store/marketing-slides", { method: "GET" })
        setSlides(res.marketing_slides || [])
      } catch {
        // No slides available — marketing panel shows fallback
      }
    }
    fetchSlides()
  }, [])

  const handleLogin = async (
    email: string,
    password: string,
    _rememberMe: boolean
  ) => {
    setServerError(null)
    try {
      await login(email, password)
      // Redirect handled by useEffect above
    } catch {
      throw new Error("Invalid email or password")
    }
  }

  const handleGoogleLogin = () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
    window.location.href = `${backendUrl}/auth/customer/google`
  }

  return (
    <AuthScreen
      view="login"
      marketingSlides={slides}
      passwordRequirements={PASSWORD_REQUIREMENTS}
      onLogin={handleLogin}
      onGoogleLogin={handleGoogleLogin}
      onNavigate={(view) => {
        if (view === "register") router.push("/register")
        else if (view === "forgot-password") router.push("/forgot-password")
      }}
      serverError={serverError}
    />
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
