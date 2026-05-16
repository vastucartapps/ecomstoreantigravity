/**
 * E.164 phone normalization for VastuCart transactional channels.
 *
 * Twilio (SMS) and Meta WhatsApp Cloud API both require strict E.164:
 *   +<country_code><subscriber_number>
 * with no spaces, hyphens, or parentheses, and a leading '+'.
 *
 * Previous behavior raw-concatenated "+" + phone, which only worked when
 * the customer already included the country code. Indian phones entered as
 * "9876543210" became "+9876543210" — invalid and rejected by both APIs.
 */

/** ISO 3166-1 alpha-2 country code → E.164 country calling code. */
const COUNTRY_DIAL_CODES: Record<string, string> = {
  IN: "91",
  US: "1",
  CA: "1",
  GB: "44",
  AU: "61",
  AE: "971",
  SG: "65",
  MY: "60",
  NP: "977",
  LK: "94",
  BD: "880",
  PK: "92",
  DE: "49",
  FR: "33",
  IT: "39",
  ES: "34",
  NL: "31",
  NZ: "64",
  JP: "81",
  CN: "86",
  HK: "852",
  ZA: "27",
  BR: "55",
  MX: "52",
}

/** Default dial code used when neither phone nor address carries one. */
const DEFAULT_DIAL_CODE = "91" // India — primary VastuCart region

function stripNonDigits(value: string): string {
  return value.replace(/[^\d]/g, "")
}

/**
 * Normalize a raw phone string + optional ISO country code to E.164.
 * Returns null if input is too short to be a real phone.
 *
 * Examples:
 *   toE164("9876543210", "IN")        → "+919876543210"
 *   toE164("+91 98765-43210", "IN")   → "+919876543210"
 *   toE164("+1 (415) 555-0100", "US") → "+14155550100"
 *   toE164("  ")                       → null
 */
export function toE164(raw: string | null | undefined, countryCode?: string | null): string | null {
  if (!raw || typeof raw !== "string") return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Already E.164-ish (has leading +): strip non-digits after +.
  if (trimmed.startsWith("+")) {
    const digits = stripNonDigits(trimmed)
    if (digits.length < 8) return null
    return `+${digits}`
  }

  const digits = stripNonDigits(trimmed)
  if (digits.length < 7) return null

  const iso = (countryCode || "").toUpperCase()
  const dial = COUNTRY_DIAL_CODES[iso] || DEFAULT_DIAL_CODE

  // Some users enter the country code without "+" — detect by length match.
  // Indian phones are 10 digits subscriber + 2 code; if input is 12+ digits
  // and starts with the dial code, assume it's already country-prefixed.
  if (digits.length >= dial.length + 7 && digits.startsWith(dial)) {
    return `+${digits}`
  }

  return `+${dial}${digits}`
}
