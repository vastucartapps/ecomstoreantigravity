/**
 * VastuCart Cookie Consent — storage + types.
 *
 * GDPR / UK PECR / EU ePrivacy compliance: analytics and marketing cookies
 * cannot fire until the visitor opts in. We bucket cookies into three
 * categories that map cleanly onto the integrations we use:
 *
 *   essential  — auth, cart, region cookie, consent storage itself.
 *                Always on. No banner question.
 *   analytics  — GA4 measurement. Fires page_view + funnel events.
 *   marketing  — Meta Pixel, TikTok/Pinterest/Snapchat/Twitter/LinkedIn,
 *                Google Ads retargeting. Used for ad targeting.
 *
 * Functional widgets (Chatwoot live chat, WhatsApp button) are treated as
 * essential because they require explicit user action to engage and store
 * no tracking identifiers until the user opens them.
 */

export type ConsentCategory = "essential" | "analytics" | "marketing"

export interface ConsentState {
  analytics: boolean
  marketing: boolean
  /** ISO timestamp when the visitor last saved a decision. */
  decidedAt: string | null
  /** Schema version — bump when categories change so old records re-prompt. */
  version: number
}

export const CONSENT_STORAGE_KEY = "vc_consent_v1"
export const CONSENT_CURRENT_VERSION = 1

export const CONSENT_DEFAULT: ConsentState = {
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: CONSENT_CURRENT_VERSION,
}

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return CONSENT_DEFAULT
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return CONSENT_DEFAULT
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    if (parsed.version !== CONSENT_CURRENT_VERSION) return CONSENT_DEFAULT
    return {
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      decidedAt: parsed.decidedAt ?? null,
      version: CONSENT_CURRENT_VERSION,
    }
  } catch {
    return CONSENT_DEFAULT
  }
}

export function writeConsent(next: Pick<ConsentState, "analytics" | "marketing">): ConsentState {
  const state: ConsentState = {
    analytics: !!next.analytics,
    marketing: !!next.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_CURRENT_VERSION,
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state))
      // Broadcast so other tabs + the TrackingScripts hook react instantly.
      window.dispatchEvent(new CustomEvent("vc-consent-changed", { detail: state }))
    } catch {
      // Quota / private-mode — degrade silently.
    }
  }
  return state
}

export function hasDecided(state: ConsentState): boolean {
  return !!state.decidedAt
}
