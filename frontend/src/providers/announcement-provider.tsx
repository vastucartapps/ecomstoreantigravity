"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

interface AnnouncementContextValue {
  text: string | null
  link: string | null
  linkText: string | null
  bgColor: string
  textColor: string
  isActive: boolean
  isDismissed: boolean
  dismiss: () => void
}

const AnnouncementContext = createContext<AnnouncementContextValue | null>(null)

const DISMISSED_KEY = "vastucart_announcement_dismissed"

export function AnnouncementProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [linkText, setLinkText] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState("#013f47")
  const [textColor, setTextColor] = useState("#ffffff")
  const [serverActive, setServerActive] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed this session
    if (typeof window !== "undefined" && sessionStorage.getItem(DISMISSED_KEY)) {
      setIsDismissed(true)
    }

    const fetchAnnouncement = async () => {
      try {
        // Try new storefront-config first
        const res = await fetch(`${BACKEND_URL}/store/storefront-config`)
        if (res.ok) {
          const data = await res.json()
          const ann = data.config?.announcement
          if (ann) {
            // Check schedule
            const now = new Date()
            let scheduleValid = true
            if (ann.schedule?.startDate) {
              scheduleValid = scheduleValid && now >= new Date(ann.schedule.startDate)
            }
            if (ann.schedule?.endDate) {
              scheduleValid = scheduleValid && now <= new Date(ann.schedule.endDate + "T23:59:59")
            }

            if (ann.isActive && scheduleValid && ann.message) {
              setText(ann.message)
              setLink(ann.linkUrl || null)
              setLinkText(ann.linkText || null)
              setBgColor(ann.bgColor || "#013f47")
              setTextColor(ann.textColor || "#ffffff")
              setServerActive(true)
              return
            }
          }
        }
      } catch {
        // fall through to legacy
      }

      // Legacy fallback: read from /store endpoint
      try {
        const res = await fetch(`${BACKEND_URL}/store`)
        if (res.ok) {
          const data = await res.json()
          const meta = data.store?.metadata
          if (meta?.announcement_text) {
            setText(meta.announcement_text)
            setLink(meta.announcement_link || null)
            setLinkText(null)
            setBgColor("#013f47")
            setTextColor("#ffffff")
            setServerActive(true)
          }
        }
      } catch {
        // No announcement available — that's fine
      }
    }

    fetchAnnouncement()
  }, [])

  const dismiss = () => {
    setIsDismissed(true)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISSED_KEY, "1")
    }
  }

  return (
    <AnnouncementContext.Provider
      value={{
        text,
        link,
        linkText,
        bgColor,
        textColor,
        isActive: serverActive && !!text && !isDismissed,
        isDismissed,
        dismiss,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncement() {
  const ctx = useContext(AnnouncementContext)
  if (!ctx)
    throw new Error("useAnnouncement must be used within AnnouncementProvider")
  return ctx
}
