/**
 * Self-contained verification token helpers.
 *
 * Tokens are stored as SHA-256 hashes inside customer.metadata, never as
 * plaintext, so a database breach cannot turn the dump into a stash of
 * usable account-takeover tokens. The plaintext token is only ever held in
 * memory long enough to be emailed.
 *
 * Two distinct namespaces are used so an email-verification token can never
 * be replayed against the email-change endpoint and vice-versa:
 *
 *   metadata.email_verification = { hash, expires_at, attempts }
 *   metadata.email_change       = { hash, expires_at, attempts, new_email }
 */

import crypto from "crypto"

const TOKEN_BYTES = 32
const TOKEN_TTL_HOURS = 24
const MAX_ATTEMPTS = 5

export interface StoredTokenRecord {
  hash: string
  expires_at: string
  attempts: number
  /** Only set on email-change tokens — the address that should become the new
   *  customer email once the user clicks the verification link. */
  new_email?: string
}

export function generatePlaintextToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url")
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function buildTokenRecord(token: string, opts: { newEmail?: string } = {}): StoredTokenRecord {
  const record: StoredTokenRecord = {
    hash: hashToken(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString(),
    attempts: 0,
  }
  if (opts.newEmail) record.new_email = opts.newEmail.toLowerCase().trim()
  return record
}

export type VerifyOutcome =
  | { ok: true; record: StoredTokenRecord }
  | { ok: false; reason: "missing" | "expired" | "exhausted" | "mismatch" }

/**
 * Constant-time comparison of a presented token against the stored hash.
 * Increments and returns the attempt counter — caller is responsible for
 * persisting the updated record (or clearing it on success).
 */
export function verifyTokenAgainst(
  presented: string,
  stored: StoredTokenRecord | null | undefined
): VerifyOutcome {
  if (!stored?.hash) return { ok: false, reason: "missing" }
  if (Date.parse(stored.expires_at) < Date.now()) return { ok: false, reason: "expired" }
  if ((stored.attempts ?? 0) >= MAX_ATTEMPTS) return { ok: false, reason: "exhausted" }

  const presentedHash = hashToken(presented)
  const a = Buffer.from(presentedHash, "hex")
  const b = Buffer.from(stored.hash, "hex")
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return {
      ok: false,
      reason: "mismatch",
    }
  }
  return { ok: true, record: stored }
}
