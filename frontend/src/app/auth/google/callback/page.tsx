"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { medusa } from "@/lib/medusa"
import { primary, fonts } from "@/lib/theme"

function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const payload = token.split(".")[1]
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
  } catch {
    return {}
  }
}

function GoogleCallbackContent() {
  const searchParams = useSearchParams()
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const token = searchParams.get("token")
    if (!token) {
      window.location.href = "/login?error=oauth_failed"
      return
    }

    // Store token where the Medusa JS SDK reads it on every API call
    localStorage.setItem("medusa_auth_token", token)

    // Recover destination saved before the OAuth redirect
    const returnTo = localStorage.getItem("oauth_return_to") || "/account"
    localStorage.removeItem("oauth_return_to")

    const finish = async () => {
      // Returning Google OAuth users: token is a valid auth JWT → retrieve succeeds.
      // First-time Google OAuth users: token is a registration JWT (actor_id = "")
      // → retrieve throws 401 → we create the customer record below.
      try {
        const { customer } = await medusa.store.customer.retrieve()
        if (customer) {
          // Returning user — token is already a valid auth JWT. Navigate directly.
          window.location.href = returnTo
          return
        }
      } catch {
        // 401 — registration JWT; customer not yet linked to this Google identity
      }

      // New user: decode the JWT to get Google profile info
      const payload = decodeJwtPayload(token)
      const email = payload.user_metadata?.email || ""
      const firstName = payload.user_metadata?.given_name || ""
      const lastName = payload.user_metadata?.family_name || ""

      // Create customer record — Medusa links the Google auth identity to this customer.
      // Medusa requires email even with a registration JWT (it does not auto-extract it).
      try {
        await (medusa.client.fetch as any)("/store/customers", {
          method: "POST",
          body: { email, first_name: firstName, last_name: lastName },
        })
      } catch (err: any) {
        if (err?.status === 422) {
          // Email already registered via a different auth method (e.g. email+password).
          // Can't link accounts automatically — ask the user to sign in with their password.
          window.location.href = "/login?error=email_exists"
          return
        }
        throw err
      }

      // Exchange the registration JWT for a full auth JWT (now includes actor_id = customer_id).
      // POST /auth/token/refresh re-generates the token using the auth identity, which is now
      // linked to the newly created customer.
      const refreshRes = await (medusa.client.fetch as any)("/auth/token/refresh", {
        method: "POST",
      })
      if (refreshRes?.token) {
        localStorage.setItem("medusa_auth_token", refreshRes.token)
      }

      // Full page reload — AuthProvider re-reads token from localStorage on fresh mount,
      // avoiding React state race conditions with router.replace().
      window.location.href = returnTo
    }

    finish().catch(() => {
      window.location.href = "/login?error=oauth_failed"
    })
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
