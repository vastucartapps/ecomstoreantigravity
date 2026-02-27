"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { medusa } from "@/lib/medusa"
import { primary, fonts } from "@/lib/theme"

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

    const finish = async () => {
      // Returning Google OAuth users: token is a valid auth JWT → retrieve succeeds.
      // First-time Google OAuth users: token is a registration JWT (actor not yet linked)
      // → retrieve throws 401 → we create the customer record below.
      let customerExists = false
      try {
        const { customer } = await medusa.store.customer.retrieve()
        customerExists = !!customer
      } catch {
        // 401 — registration token; customer not yet linked to this Google identity
      }

      if (!customerExists) {
        // Create the customer record. The registration JWT in localStorage authorises
        // this call. Medusa reads the email from the Google auth identity — no body needed.
        await (medusa.client.fetch as any)("/store/customers", {
          method: "POST",
          body: {},
        })
      }

      // Full page reload rather than router.replace():
      // router.replace() is a client-side nav that renders /account before React has
      // flushed the setUser() call from refreshUser(), so the shell briefly sees
      // user=null and redirects to /login. A full reload lets AuthProvider re-init
      // from localStorage cleanly with no race condition.
      window.location.href = "/account"
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
