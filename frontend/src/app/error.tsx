"use client"

import { useEffect } from "react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[RootError]", error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: "#fffbf5", margin: 0, fontFamily: "'Open Sans', sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
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
              borderRadius: 16,
              padding: "40px 32px",
              textAlign: "center",
              boxShadow: "0 4px 24px rgba(1,63,71,0.08)",
              border: "1px solid #f0ebe4",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1
              style={{
                fontFamily: "'Lora', serif",
                color: "#013f47",
                fontSize: 22,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: "#75615a", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              We encountered an unexpected error. Our team has been notified. Please try again
              or return to the homepage.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
              <a
                href="/"
                style={{
                  padding: "10px 24px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "#013f47",
                  border: "1px solid #013f47",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
