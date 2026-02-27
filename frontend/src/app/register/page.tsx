"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthScreen } from "@/components/auth"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"
import type { MarketingSlide, PasswordRequirement } from "@/types/auth"
import { AUTH_CAROUSEL_IMAGES } from "@/lib/image-constants"

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", key: "minLength" },
  { label: "One uppercase letter", key: "uppercase" },
  { label: "One lowercase letter", key: "lowercase" },
  { label: "One number", key: "number" },
  { label: "One special character (!@#$%)", key: "special" },
]

const DEFAULT_SLIDES: MarketingSlide[] = [
  {
    id: "default-1",
    image_url: AUTH_CAROUSEL_IMAGES[0].image_url,
    quote: "Transform your space with the ancient wisdom of Vastu Shastra and the healing power of crystals",
    attribution: "VastuCart",
    is_active: true,
    display_order: 1,
  },
  {
    id: "default-2",
    image_url: AUTH_CAROUSEL_IMAGES[1].image_url,
    quote: "Every crystal carries the energy of millions of years. Let their vibrations elevate your life",
    attribution: "Ancient Wisdom",
    is_active: true,
    display_order: 2,
  },
  {
    id: "default-3",
    image_url: AUTH_CAROUSEL_IMAGES[2].image_url,
    quote: "Authentic, ethically sourced spiritual products delivered with care to your doorstep",
    attribution: "VastuCart Promise",
    is_active: true,
    display_order: 3,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const { user, isAdmin, register } = useAuth()
  const [slides, setSlides] = useState<MarketingSlide[]>(DEFAULT_SLIDES)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isAdmin) router.replace("/admin")
      else router.replace("/")
    }
  }, [user, isAdmin, router])

  // Fetch marketing slides (use defaults as fallback)
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await medusa.client.fetch<{
          marketing_slides: MarketingSlide[]
        }>("/store/marketing-slides", { method: "GET" })
        if (res.marketing_slides?.length) {
          setSlides(res.marketing_slides)
        }
      } catch {
        // API not available — keep default slides
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

  const handleGoogleLogin = async () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
    try {
      const res = await fetch(`${backendUrl}/auth/customer/google`, {
        method: "GET",
        credentials: "include",
      })
      const data = await res.json()
      if (data?.location) {
        window.location.href = data.location
      }
    } catch {
      window.location.href = `${backendUrl}/auth/customer/google`
    }
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
