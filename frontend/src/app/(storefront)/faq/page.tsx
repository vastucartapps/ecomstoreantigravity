"use client"
import { bg, primary, earth, fonts, shadows } from "@/lib/theme"

export default function Page() {
  return (
    <div
      style={{
        minHeight: "70vh",
        backgroundColor: bg.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        className="gradient-border-top"
        style={{
          backgroundColor: bg.card,
          borderRadius: "0.75rem",
          padding: "3rem 2.5rem",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          boxShadow: shadows.card,
        }}
      >
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "1.875rem",
            fontWeight: 700,
            color: primary[500],
            marginBottom: "0.75rem",
          }}
        >
          FAQ
        </h1>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: "0.9375rem",
            color: earth[400],
            marginBottom: "1.5rem",
          }}
        >
          Frequently asked questions about VastuCart.
        </p>
        <span
          style={{
            display: "inline-block",
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: `1.5px solid ${primary[200]}`,
            backgroundColor: primary[50],
            fontFamily: fonts.body,
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: primary[500],
          }}
        >
          Coming in Section 08
        </span>
      </div>
    </div>
  )
}
