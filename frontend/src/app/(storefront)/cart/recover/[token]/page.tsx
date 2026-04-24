"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
const CART_ID_KEY = "vastucart_cart_id"
const RECOVERY_CODE_KEY = "vastucart_recovery_code"

type State =
  | { status: "loading" }
  | { status: "ready"; discountCode: string | null }
  | { status: "expired"; message: string }
  | { status: "error"; message: string }

export default function RecoverCartPage() {
  const params = useParams()
  const router = useRouter()
  const token = typeof params?.token === "string" ? params.token : ""

  const initialState = useMemo<State>(
    () => token ? { status: "loading" } : { status: "error", message: "Missing recovery token" },
    [token]
  )
  const [state, setState] = useState<State>(initialState)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/store/cart/recover/${encodeURIComponent(token)}`,
          { headers: { "x-publishable-api-key": PUB_KEY } }
        )

        if (cancelled) return

        if (res.status === 404) {
          setState({ status: "expired", message: "This recovery link is no longer valid." })
          return
        }
        if (res.status === 410) {
          setState({ status: "expired", message: "This cart has already been recovered." })
          return
        }
        if (!res.ok) {
          setState({ status: "error", message: "We couldn't recover your cart. Please try again." })
          return
        }

        const data: { cart_id: string; discount_code: string | null } = await res.json()
        if (!data.cart_id) {
          setState({ status: "error", message: "Recovery failed — cart not found." })
          return
        }

        try {
          localStorage.setItem(CART_ID_KEY, data.cart_id)
          if (data.discount_code) {
            localStorage.setItem(RECOVERY_CODE_KEY, data.discount_code)
          } else {
            localStorage.removeItem(RECOVERY_CODE_KEY)
          }
        } catch {
          // localStorage may be blocked in some browsers — the fetch still serves the recovery
        }

        setState({ status: "ready", discountCode: data.discount_code })

        // Brief display of the welcome message + discount code before redirect
        setTimeout(() => router.replace("/cart"), data.discount_code ? 2200 : 800)
      } catch {
        if (!cancelled) setState({ status: "error", message: "Network error while recovering your cart." })
      }
    })()

    return () => { cancelled = true }
  }, [token, router])

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        {state.status === "loading" && (
          <>
            <h1 style={{ fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#013f47", marginBottom: 10 }}>
              Restoring your cart…
            </h1>
            <p style={{ color: "#6b5d52", fontSize: 14 }}>Just a moment.</p>
          </>
        )}

        {state.status === "ready" && (
          <>
            <h1 style={{ fontSize: 28, fontFamily: "Cormorant Garamond, serif", color: "#013f47", marginBottom: 10 }}>
              Welcome back
            </h1>
            <p style={{ color: "#6b5d52", fontSize: 15, marginBottom: state.discountCode ? 20 : 0 }}>
              We&apos;ve brought your cart back for you.
            </p>
            {state.discountCode && (
              <div style={{ background: "#fff7e6", border: "1px dashed #c85103", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 12, color: "#8a5a1f", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  Your 5% welcome-back discount
                </div>
                <code style={{ fontSize: 22, fontWeight: 700, color: "#c85103", fontFamily: "monospace", letterSpacing: 2 }}>
                  {state.discountCode}
                </code>
                <div style={{ fontSize: 12, color: "#6b5d52", marginTop: 8 }}>
                  Apply it at checkout. Redirecting you now…
                </div>
              </div>
            )}
          </>
        )}

        {state.status === "expired" && (
          <>
            <h1 style={{ fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#013f47", marginBottom: 10 }}>
              Link expired
            </h1>
            <p style={{ color: "#6b5d52", fontSize: 14, marginBottom: 20 }}>{state.message}</p>
            <Link href="/" style={linkBtn}>Continue shopping</Link>
          </>
        )}

        {state.status === "error" && (
          <>
            <h1 style={{ fontSize: 24, fontFamily: "Cormorant Garamond, serif", color: "#013f47", marginBottom: 10 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b5d52", fontSize: 14, marginBottom: 20 }}>{state.message}</p>
            <Link href="/cart" style={linkBtn}>Go to cart</Link>
          </>
        )}
      </div>
    </div>
  )
}

const linkBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 22px",
  background: "#013f47",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 600,
}
