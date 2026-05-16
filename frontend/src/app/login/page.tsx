"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthScreen } from "@/components/auth"
import { useAuth } from "@/providers/auth-provider"
import { useBranding } from "@/providers/announcement-provider"
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

/**
 * Build the carousel slide defaults with admin's storeName interpolated
 * into attribution lines so a single edit (Storefront → Branding → Store
 * Name) updates the auth carousel here too.
 */
function buildDefaultSlides(storeName: string): MarketingSlide[] {
  return [
    {
      id: "default-1",
      image_url: AUTH_CAROUSEL_IMAGES[0].image_url,
      quote: "Transform your space with the ancient wisdom of Vastu Shastra and the healing power of crystals",
      attribution: storeName,
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
      attribution: `${storeName} Promise`,
      is_active: true,
      display_order: 3,
    },
  ]
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAdmin, login, register } = useAuth()
  const branding = useBranding()
  const [slides, setSlides] = useState<MarketingSlide[]>(() =>
    buildDefaultSlides(branding.storeName)
  )
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

  const handleLogin = async (email: string, password: string) => {
    setServerError(null)
    try {
      await login(email, password)
      // Redirect handled by useEffect above
    } catch {
      throw new Error("Invalid email or password")
    }
  }

  const handleGoogleLogin = async () => {
    // Preserve returnTo so the callback page can redirect the user back after sign-in
    localStorage.setItem("oauth_return_to", returnTo || "/account")
    // Generate a per-attempt nonce so the callback can refuse to honor a token
    // that arrived in a browser that never initiated the OAuth flow — defends
    // against a session-fixation drive-by where an attacker delivers their own
    // valid token via a crafted /auth/google/callback?token=… link.
    const nonce =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem("oauth_state", nonce)
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
      // Fallback: navigate directly
      window.location.href = `${backendUrl}/auth/customer/google`
    }
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
