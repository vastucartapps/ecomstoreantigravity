"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[StorefrontError]", error)
  }, [error])

  return (
    <div style={{ background: "#fffbf5", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "#ffffff",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(1,63,71,0.08)",
          border: "1px solid #f0ebe4",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🪴</div>
        <h1
          style={{
            fontFamily: "'Lora', serif",
            color: "#013f47",
            fontSize: 24,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: "#75615a", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          We encountered an unexpected error while loading this page. Please try again or
          browse our other products.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              background: "#013f47",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              background: "transparent",
              color: "#013f47",
              border: "1px solid #013f47",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
