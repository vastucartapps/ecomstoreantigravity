"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error("[AdminError]", error)
  }, [error])

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8f9fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          background: "#ffffff",
          borderRadius: 12,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 24,
          }}
        >
          ⚠️
        </div>
        <h1
          style={{
            fontFamily: "'Lora', serif",
            color: "#111827",
            fontSize: 20,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Admin panel error
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          An unexpected error occurred in the admin panel. Check the browser console for
          details. You can try again or navigate to another section.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre
            style={{
              background: "#f3f4f6",
              borderRadius: 8,
              padding: 12,
              fontSize: 11,
              textAlign: "left",
              marginBottom: 20,
              overflow: "auto",
              maxHeight: 120,
              color: "#ef4444",
            }}
          >
            {error.message}
          </pre>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
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
            onClick={() => router.push("/admin")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              background: "transparent",
              color: "#374151",
              border: "1px solid #d1d5db",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Admin Home
          </button>
        </div>
      </div>
    </div>
  )
}
