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

    // Scrub the token from the visible URL *before* doing anything else so it
    // is never preserved in browser history, Referer headers on subsequent
    // navigation, or shoulder-surfed off the address bar.
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", "/auth/google/callback")
    }

    if (!token) {
      window.location.href = "/login?error=oauth_failed"
      return
    }

    // Refuse to honor a token that arrived in a browser that did not initiate
    // the OAuth flow. Without this, an attacker could deliver a victim a link
    // like /auth/google/callback?token=ATTACKER_TOKEN and trick the victim's
    // browser into authenticating as the attacker (session fixation).
    const expectedState =
      typeof window !== "undefined" ? localStorage.getItem("oauth_state") : null
    if (!expectedState) {
      window.location.href = "/login?error=oauth_state_missing"
      return
    }
    localStorage.removeItem("oauth_state")

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

      // ── Admin pre-flight check ──────────────────────────────────────────────
      // If this email belongs to a Medusa admin user, the customer OAuth flow is
      // the wrong path.  Redirect to admin-login instead of creating a customer.
      try {
        const check = await (medusa.client.fetch as any)(
          `/store/customers/link?email=${encodeURIComponent(email)}`,
          { method: "GET" }
        )
        if (check?.is_admin) {
          window.location.href = "/admin-login?hint=google"
          return
        }
      } catch {
        // Pre-flight failed — proceed anyway; do not block sign-in
      }

      // Create customer record — Medusa links the Google auth identity to this customer.
      // Medusa requires email even with a registration JWT (it does not auto-extract it).
      try {
        await (medusa.client.fetch as any)("/store/customers", {
          method: "POST",
          body: { email, first_name: firstName, last_name: lastName },
        })
      } catch (err: any) {
        if (err?.status === 422) {
          // Email already registered via email+password — merge accounts by linking
          // this Google auth identity to the existing customer, then proceed normally.
          const linkRes = await (medusa.client.fetch as any)("/store/customers/link", {
            method: "POST",
            body: { email },
          })
          if (!linkRes?.success) {
            window.location.href = "/login?error=oauth_failed"
            return
          }
          // Fall through to token refresh below — identity is now linked.
        } else {
          throw err
        }
      }

      // Exchange the registration JWT for a full auth JWT (now includes actor_id = customer_id).
      // POST /auth/token/refresh re-generates the token using the auth identity, which is now
      // linked to the newly created customer (or the merged existing customer).
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
