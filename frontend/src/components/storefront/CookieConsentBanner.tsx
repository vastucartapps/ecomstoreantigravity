"use client"

/**
 * VastuCart Cookie Consent Banner + Preferences Modal.
 *
 * Renders a bottom-anchored banner the first time a visitor lands, or
 * any time they open Preferences from the footer. Decision is persisted
 * to localStorage by the provider; TrackingScripts gates GA4 / Pixel /
 * marketing tags on the saved value.
 *
 * Layout is mobile-first, contained in a max-width card so it doesn't
 * dominate desktop. No external CSS framework calls — uses the same
 * inline-styled palette as the rest of the storefront chrome.
 */

import { useEffect, useState } from "react"
import { useConsent } from "@/providers/cookie-consent-provider"
import { useBranding } from "@/providers/announcement-provider"

export function CookieConsentBanner() {
  const { consent, showPrompt, acceptAll, rejectAll, save, closePreferences } = useConsent()
  const branding = useBranding()
  const [mode, setMode] = useState<"banner" | "details">("banner")
  const [analytics, setAnalytics] = useState(consent.analytics)
  const [marketing, setMarketing] = useState(consent.marketing)

  // Re-sync toggles when re-opened with a saved decision so the modal
  // reflects the visitor's current state, not stale defaults.
  useEffect(() => {
    if (showPrompt) {
      setAnalytics(consent.analytics)
      setMarketing(consent.marketing)
      setMode("banner")
    }
  }, [showPrompt, consent.analytics, consent.marketing])

  if (!showPrompt) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-modal="false"
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "16px",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          maxWidth: "780px",
          width: "100%",
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 12px 40px rgba(1,63,71,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          border: "1px solid #e8e0d8",
          padding: "20px 22px",
          color: "#013f47",
          fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
        }}
      >
        {mode === "banner" ? (
          <BannerContents
            onAcceptAll={acceptAll}
            onRejectAll={rejectAll}
            onCustomize={() => setMode("details")}
            storeName={branding.storeName}
            contactEmail={branding.contactEmail}
          />
        ) : (
          <DetailsContents
            analytics={analytics}
            marketing={marketing}
            setAnalytics={setAnalytics}
            setMarketing={setMarketing}
            onSave={() => save({ analytics, marketing })}
            onBack={() => setMode("banner")}
            onClose={closePreferences}
            storeName={branding.storeName}
          />
        )}
      </div>
    </div>
  )
}

function BannerContents({
  onAcceptAll,
  onRejectAll,
  onCustomize,
  storeName,
  contactEmail,
}: {
  onAcceptAll: () => void
  onRejectAll: () => void
  onCustomize: () => void
  storeName: string
  contactEmail: string
}) {
  return (
    <>
      <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0" }}>
        Your privacy on {storeName}
      </h2>
      <p style={{ fontSize: "13px", lineHeight: 1.5, margin: "0 0 14px 0", color: "#3a4d50" }}>
        We use cookies to keep the site working (essential), measure how visitors use
        it (analytics) and personalise ads (marketing). Analytics and marketing
        cookies only run with your consent. Read our{" "}
        <a href="/privacy-policy" style={{ color: "#013f47", textDecoration: "underline" }}>
          privacy policy
        </a>{" "}
        or email{" "}
        <a href={`mailto:${contactEmail}`} style={{ color: "#013f47", textDecoration: "underline" }}>
          {contactEmail}
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={onAcceptAll} style={btn("primary")} type="button">
          Accept all
        </button>
        <button onClick={onRejectAll} style={btn("secondary")} type="button">
          Reject non-essential
        </button>
        <button onClick={onCustomize} style={btn("ghost")} type="button">
          Customise
        </button>
      </div>
    </>
  )
}

function DetailsContents({
  analytics,
  marketing,
  setAnalytics,
  setMarketing,
  onSave,
  onBack,
  onClose,
  storeName,
}: {
  analytics: boolean
  marketing: boolean
  setAnalytics: (v: boolean) => void
  setMarketing: (v: boolean) => void
  onSave: () => void
  onBack: () => void
  onClose: () => void
  storeName: string
}) {
  return (
    <>
      <h2 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px 0" }}>
        Cookie preferences
      </h2>
      <Category
        title="Essential"
        body={`Required for authentication, cart, region detection, and saving your preferences. Cannot be turned off — ${storeName} won't work without them.`}
        checked
        disabled
      />
      <Category
        title="Analytics"
        body="Google Analytics 4. Measures page views, search, and checkout funnel so we can fix what's slow or confusing. No advertising use."
        checked={analytics}
        onChange={setAnalytics}
      />
      <Category
        title="Marketing"
        body="Meta Pixel, Google Ads, and other advertising platform tags. Used to show you relevant ads on social networks and to measure ad effectiveness."
        checked={marketing}
        onChange={setMarketing}
      />
      <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
        <button onClick={onSave} style={btn("primary")} type="button">
          Save preferences
        </button>
        <button onClick={onBack} style={btn("ghost")} type="button">
          Back
        </button>
        <button onClick={onClose} style={{ ...btn("ghost"), marginLeft: "auto" }} type="button">
          Close
        </button>
      </div>
    </>
  )
}

function Category({
  title,
  body,
  checked,
  onChange,
  disabled,
}: {
  title: string
  body: string
  checked: boolean
  onChange?: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: "12px",
        padding: "10px 0",
        borderTop: "1px solid #f0e8df",
        alignItems: "flex-start",
        cursor: disabled ? "default" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        style={{ marginTop: "3px", accentColor: "#013f47", flexShrink: 0 }}
      />
      <span>
        <span style={{ display: "block", fontSize: "13px", fontWeight: 600 }}>
          {title}
          {disabled ? <span style={{ fontWeight: 400, color: "#75615a", marginLeft: "6px" }}>(always on)</span> : null}
        </span>
        <span style={{ display: "block", fontSize: "12px", color: "#75615a", marginTop: "2px", lineHeight: 1.45 }}>
          {body}
        </span>
      </span>
    </label>
  )
}

type ButtonKind = "primary" | "secondary" | "ghost"
function btn(kind: ButtonKind): React.CSSProperties {
  const base: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "1px solid transparent",
    fontFamily: "inherit",
  }
  if (kind === "primary") {
    return { ...base, background: "#013f47", color: "#fff", borderColor: "#013f47" }
  }
  if (kind === "secondary") {
    return { ...base, background: "#fff", color: "#013f47", borderColor: "#013f47" }
  }
  return { ...base, background: "transparent", color: "#013f47", borderColor: "transparent", textDecoration: "underline" }
}
