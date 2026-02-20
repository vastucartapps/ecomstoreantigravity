"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/providers/auth-provider"
import { Package, ArrowRight, LogIn } from "lucide-react"
import { primary, earth, fonts, bg } from "@/lib/theme"

export default function TrackOrderPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/account/orders")
    }
  }, [user, isLoading, router])

  if (isLoading) return null

  if (user) return null // redirecting

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg.primary,
        padding: "2rem",
        fontFamily: fonts.body,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: `${primary[500]}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}
        >
          <Package size={32} color={primary[500]} />
        </div>

        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "1.75rem",
            fontWeight: 700,
            color: primary[500],
            marginBottom: "0.75rem",
          }}
        >
          Track Your Order
        </h1>
        <p
          style={{
            color: earth[400],
            fontSize: "0.9375rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Sign in to your VastuCart account to view real-time order status, tracking details, and delivery updates.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
          <Link
            href="/login?returnTo=/account/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              background: primary[500],
              color: "#fff",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.9375rem",
              textDecoration: "none",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <LogIn size={18} />
            Sign In to Track Order
          </Link>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: earth[400],
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            <ArrowRight size={14} />
            Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  )
}
