/* eslint-disable react/no-unknown-property */
import { ImageResponse } from "next/og"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

// Next.js generates this image at build / on-demand and serves it at
// /opengraph-image, overriding any static /og-default.png reference. The 1200×630
// canvas is what Facebook, X (Twitter), LinkedIn, WhatsApp, Slack, Discord, and
// iMessage actually consume for link previews — anything smaller renders as a
// tiny square thumbnail and undercuts CTR on every share.
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "VastuCart — Vastu-aligned home & living"
export const dynamic = "force-dynamic"

export default async function Image() {
  const b = await fetchBrandingForMetadata().catch(() => null)
  const storeName = b?.storeName || "VastuCart"
  const tagline = b?.tagline || "Sacred Essentials for Your Spiritual Journey"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #013f47 0%, #054348 60%, #0a5a63 100%)",
          color: "#fffbf5",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          {storeName}
        </div>
        <div
          style={{
            fontSize: 36,
            opacity: 0.86,
            lineHeight: 1.3,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {tagline}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            gap: 24,
            fontSize: 22,
            opacity: 0.7,
          }}
        >
          <span>India · INR</span>
          <span>·</span>
          <span>International · USD</span>
          <span>·</span>
          <span>Free shipping over ₹999</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
