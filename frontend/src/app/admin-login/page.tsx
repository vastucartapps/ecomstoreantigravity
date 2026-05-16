"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"
import type { MarketingSlide, PasswordRequirement } from "@/types/auth"
import { AuthScreen } from "@/components/auth"

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", key: "minLength" },
  { label: "One uppercase letter", key: "uppercase" },
  { label: "One lowercase letter", key: "lowercase" },
  { label: "One number", key: "number" },
  { label: "One special character (!@#$%)", key: "special" },
]

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin, adminLogin } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>([])

  const hint = searchParams.get("hint")
  const serverError =
    hint === "google"
      ? "Your email is registered as an admin account. Please sign in with your admin email and password below."
      : null

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin) {
      router.replace("/admin")
    } else if (user && !isAdmin) {
      // Logged in but not admin — send to storefront
      router.replace("/")
    }
  }, [user, isAdmin, router])

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

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      await adminLogin(email, password)
    } catch {
      throw new Error("Invalid admin credentials")
    }
  }

  return (
    <AuthScreen
      view="login"
      marketingSlides={slides}
      passwordRequirements={PASSWORD_REQUIREMENTS}
      onLogin={handleAdminLogin}
      onNavigate={(view) => {
        if (view === "register") router.push("/register")
        else if (view === "forgot-password") router.push("/forgot-password")
      }}
      serverError={serverError}
    />
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  )
}
