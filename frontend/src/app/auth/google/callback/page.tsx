"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/providers/auth-provider"
import { medusa } from "@/lib/medusa"
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

    const finish = async () => {
      // Try to retrieve the customer with the stored token.
      // Returning Google OAuth users → succeeds immediately.
      // First-time Google OAuth users → throws 401 because the customer record
      // doesn't exist yet (Medusa issued a registration token, not an auth token).
      let customerExists = false
      try {
        const { customer } = await medusa.store.customer.retrieve()
        customerExists = !!customer
      } catch {
        // 401 — new user; customer not yet created
      }

      if (!customerExists) {
        // Create the customer record linked to this Google auth identity.
        // The registration token in localStorage authorises this creation.
        // Email/profile are pulled from the Google identity by Medusa — body can be empty.
        await (medusa.client.fetch as (path: string, opts: object) => Promise<unknown>)(
          "/store/customers",
          { method: "POST", body: {} }
        )
      }

      // Update the React auth context with the now-authenticated customer
      await refreshUser()
      router.replace("/account")
    }

    finish().catch(() => router.replace("/login?error=oauth_failed"))
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
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
