"use client"
import { primary, earth, fonts } from "@/lib/theme"

export default function GiftCardsPage() {
  return (
    <div>
      <h1
        style={{
          fontFamily: fonts.heading,
          color: primary[900],
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "0.5rem",
        }}
      >
        Gift Cards
      </h1>
      <p style={{ color: earth[400], fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Issue and manage digital gift cards for your store
      </p>
      <div
        className="gradient-border-top"
        style={{
          background: "white",
          borderRadius: "0.75rem",
          padding: "3rem",
          textAlign: "center",
        }}
      >
        <p style={{ color: earth[400], fontSize: "0.875rem" }}>
          Coming in Section 14
        </p>
      </div>
    </div>
  )
}
