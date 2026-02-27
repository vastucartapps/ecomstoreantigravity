"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { primary, fonts } from "@/lib/theme"

function GoogleCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const token = searchParams.get("token")
    if (!token) {
      router.replace("/login?error=oauth_failed")
      return
    }

    // Store token where the Medusa JS SDK reads it (localStorage key: medusa_auth_token)
    localStorage.setItem("medusa_auth_token", token)

    // Refresh auth state — SDK reads token from localStorage on next API call
    refreshUser()
      .then(() => router.replace("/account"))
      .catch(() => router.replace("/login?error=oauth_failed"))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: fonts.body,
        gap: "1rem",
        backgroundColor: "#fffbf5",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          border: `3px solid ${primary[100]}`,
          borderTopColor: primary[500],
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ color: primary[700], fontSize: "0.9rem", margin: 0 }}>
        Completing sign-in&hellip;
      </p>
    </div>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackContent />
    </Suspense>
  )
}
