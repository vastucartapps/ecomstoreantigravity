"use client"

/**
 * VastuCart Cookie Consent Provider.
 *
 * Owns the consent state, exposes `useConsent()` for any component that
 * needs to gate a script or behavior, and mounts the banner UI when the
 * visitor hasn't decided yet (or has explicitly re-opened preferences).
 *
 * Multi-tab safe — listens to both the `storage` event and our own
 * `vc-consent-changed` CustomEvent so a decision in one tab updates every
 * other tab and the TrackingScripts gate without a page reload.
 */

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import {
  type ConsentState,
  CONSENT_DEFAULT,
  CONSENT_STORAGE_KEY,
  hasDecided,
  readConsent,
  writeConsent,
} from "@/lib/consent"

interface ConsentContextValue {
  consent: ConsentState
  ready: boolean
  /** True when banner/preferences UI should render. */
  showPrompt: boolean
  acceptAll: () => void
  rejectAll: () => void
  save: (next: { analytics: boolean; marketing: boolean }) => void
  /** Re-opens the preferences modal — wired to "Cookie preferences" footer link. */
  openPreferences: () => void
  closePreferences: () => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(CONSENT_DEFAULT)
  const [ready, setReady] = useState(false)
  // `forceOpen` lets the "Cookie preferences" footer link re-open the
  // banner after a decision has already been saved.
  const [forceOpen, setForceOpen] = useState(false)

  useEffect(() => {
    const initial = readConsent()
    setConsent(initial)
    setReady(true)

    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY) setConsent(readConsent())
    }
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent<ConsentState>).detail
      if (detail) setConsent(detail)
    }
    window.addEventListener("storage", onStorage)
    window.addEventListener("vc-consent-changed", onCustom as EventListener)
    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("vc-consent-changed", onCustom as EventListener)
    }
  }, [])

  const acceptAll = useCallback(() => {
    setConsent(writeConsent({ analytics: true, marketing: true }))
    setForceOpen(false)
  }, [])

  const rejectAll = useCallback(() => {
    setConsent(writeConsent({ analytics: false, marketing: false }))
    setForceOpen(false)
  }, [])

  const save = useCallback((next: { analytics: boolean; marketing: boolean }) => {
    setConsent(writeConsent(next))
    setForceOpen(false)
  }, [])

  const openPreferences = useCallback(() => setForceOpen(true), [])
  const closePreferences = useCallback(() => setForceOpen(false), [])

  const showPrompt = ready && (forceOpen || !hasDecided(consent))

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, ready, showPrompt, acceptAll, rejectAll, save, openPreferences, closePreferences }),
    [consent, ready, showPrompt, acceptAll, rejectAll, save, openPreferences, closePreferences]
  )

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    // Safe fallback: if the provider isn't mounted (server-render edge),
    // assume no consent so nothing fires before hydration.
    return {
      consent: CONSENT_DEFAULT,
      ready: false,
      showPrompt: false,
      acceptAll: () => {},
      rejectAll: () => {},
      save: () => {},
      openPreferences: () => {},
      closePreferences: () => {},
    }
  }
  return ctx
}
