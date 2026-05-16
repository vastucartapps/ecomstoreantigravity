/**
 * VastuCart Error Reporter — structured logging + optional Sentry forwarding.
 *
 * Why this exists: the codebase has many catch blocks that swallow errors,
 * making production failures invisible. captureException() guarantees every
 * caught error is written to stdout as a single-line JSON record (Coolify
 * captures stdout) AND forwarded to Sentry when SENTRY_DSN is set.
 *
 * Sentry is loaded with a runtime require() so the dependency is optional:
 *   - Without SENTRY_DSN: zero overhead, JSON log only.
 *   - With SENTRY_DSN + @sentry/node installed: full error monitoring.
 *
 * To enable Sentry in production:
 *   1. `npm install @sentry/node` in backend/
 *   2. Set SENTRY_DSN in Coolify env vars.
 */

type Sentry = {
  init: (opts: Record<string, unknown>) => void
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void
}

let sentry: Sentry | null = null
let sentryInitFailed = false

function getSentry(): Sentry | null {
  if (sentry || sentryInitFailed) return sentry
  if (!process.env.SENTRY_DSN) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@sentry/node") as Sentry
    mod.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    })
    sentry = mod
    return mod
  } catch {
    sentryInitFailed = true
    return null
  }
}

export interface ErrorContext {
  /** Where the error happened — file, function, route, subscriber. */
  source?: string
  /** Tagged data for filtering: cart_id, order_id, customer_id, etc. */
  [key: string]: unknown
}

/**
 * Capture an exception. Always logs structured JSON to stdout; forwards to
 * Sentry when configured. Never throws — error reporting must not fail open.
 */
export function captureException(err: unknown, ctx: ErrorContext = {}): void {
  try {
    const payload = {
      level: "error",
      timestamp: new Date().toISOString(),
      service: "vastucart-backend",
      error:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : { name: "NonError", message: String(err) },
      ...ctx,
    }
    // Single-line JSON makes Coolify / Loki / CloudWatch ingestion trivial.
    // eslint-disable-next-line no-console
    console.error(JSON.stringify(payload))

    const s = getSentry()
    if (s) s.captureException(err, { extra: ctx })
  } catch {
    // Reporter must never throw — last-ditch fallback.
    // eslint-disable-next-line no-console
    console.error("[error-reporter] failed to capture exception:", err)
  }
}

/** Same shape as captureException but for non-error warnings (e.g. degraded behavior). */
export function captureWarning(message: string, ctx: ErrorContext = {}): void {
  try {
    const payload = {
      level: "warn",
      timestamp: new Date().toISOString(),
      service: "vastucart-backend",
      message,
      ...ctx,
    }
    // eslint-disable-next-line no-console
    console.warn(JSON.stringify(payload))
  } catch {
    // ignore
  }
}
