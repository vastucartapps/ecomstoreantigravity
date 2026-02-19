"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { InAppAnnouncement, AnnouncementType } from "@/types/admin-notifications"

const BACKEND_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
    : ""
const PUB_KEY =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    : ""

const DISMISSED_KEY = "vc_inapp_dismissed"

interface InAppAnnouncementsContextValue {
  banners: InAppAnnouncement[]
  modals: InAppAnnouncement[]
  toasts: InAppAnnouncement[]
  dismissAnnouncement: (id: string) => void
}

const InAppAnnouncementsContext =
  createContext<InAppAnnouncementsContextValue | null>(null)

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function persistDismissed(set: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...set]))
  } catch {}
}

export function InAppAnnouncementsProvider({ children }: { children: ReactNode }) {
  const [announcements, setAnnouncements] = useState<InAppAnnouncement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    setDismissed(getDismissed())

    const load = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/store/announcements`, {
          headers: { "x-publishable-api-key": PUB_KEY },
        })
        if (!res.ok) return
        const data = await res.json()
        setAnnouncements(data.announcements || [])
      } catch {
        // backend not available — no announcements
      }
    }

    load()
  }, [])

  const dismissAnnouncement = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      persistDismissed(next)
      return next
    })
  }, [])

  const visible = announcements.filter((a) => !dismissed.has(a.id))

  const byType = (type: AnnouncementType) =>
    visible.filter((a) => a.type === type)

  return (
    <InAppAnnouncementsContext.Provider
      value={{
        banners: byType("banner"),
        modals: byType("modal"),
        toasts: byType("toast"),
        dismissAnnouncement,
      }}
    >
      {children}
      <InAppAnnouncementsRenderer />
    </InAppAnnouncementsContext.Provider>
  )
}

export function useInAppAnnouncements() {
  const ctx = useContext(InAppAnnouncementsContext)
  if (!ctx)
    throw new Error(
      "useInAppAnnouncements must be used within InAppAnnouncementsProvider"
    )
  return ctx
}

/* ─── Renderer (renders banners/modals/toasts inline) ─── */

function InAppAnnouncementsRenderer() {
  const { banners, modals, toasts, dismissAnnouncement } =
    useInAppAnnouncements()

  return (
    <>
      {/* Banners — stacked at top */}
      {banners.map((ann) => (
        <div
          key={ann.id}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "#013f47",
            color: "#fff",
            padding: "0.75rem 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            zIndex: 10000,
            fontFamily: "'Open Sans', sans-serif",
            fontSize: "0.875rem",
          }}
        >
          <div style={{ flex: 1, textAlign: "center" }}>
            <strong>{ann.title}</strong>
            {ann.message && (
              <span style={{ marginLeft: "0.5rem", opacity: 0.9 }}>
                {ann.message}
              </span>
            )}
          </div>
          <button
            onClick={() => dismissAnnouncement(ann.id)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1.25rem",
              lineHeight: 1,
              padding: "0 0.25rem",
              opacity: 0.8,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}

      {/* Modals — first modal only */}
      {modals.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
          }}
          onClick={() => dismissAnnouncement(modals[0].id)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "480px",
              width: "90%",
              position: "relative",
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            <button
              onClick={() => dismissAnnouncement(modals[0].id)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.5rem",
                color: "#75615a",
                lineHeight: 1,
              }}
              aria-label="Close"
            >
              ×
            </button>
            <h3
              style={{
                fontFamily: "'Lora', serif",
                color: "#433b35",
                fontSize: "1.25rem",
                fontWeight: 600,
                marginTop: 0,
                marginBottom: "0.75rem",
              }}
            >
              {modals[0].title}
            </h3>
            <p
              style={{
                color: "#71685b",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {modals[0].message}
            </p>
            <button
              onClick={() => dismissAnnouncement(modals[0].id)}
              style={{
                marginTop: "1.5rem",
                padding: "0.625rem 1.5rem",
                backgroundColor: "#013f47",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontFamily: "'Open Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Toasts — bottom right stack (max 3) */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 10002,
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          pointerEvents: "none",
        }}
      >
        {toasts.slice(0, 3).map((ann) => (
          <div
            key={ann.id}
            style={{
              backgroundColor: "#fff",
              borderRadius: "0.75rem",
              padding: "1rem 1.25rem",
              boxShadow:
                "0 10px 25px -5px rgba(0,0,0,0.15), 0 4px 6px -2px rgba(0,0,0,0.05)",
              maxWidth: "320px",
              borderLeft: "4px solid #013f47",
              fontFamily: "'Open Sans', sans-serif",
              pointerEvents: "auto",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontWeight: 600,
                  color: "#433b35",
                  margin: 0,
                  fontSize: "0.875rem",
                }}
              >
                {ann.title}
              </p>
              {ann.message && (
                <p
                  style={{
                    color: "#71685b",
                    fontSize: "0.8125rem",
                    marginTop: "0.25rem",
                    marginBottom: 0,
                  }}
                >
                  {ann.message}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissAnnouncement(ann.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1.25rem",
                color: "#a39585",
                lineHeight: 1,
                padding: 0,
              }}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
