/**
 * VastuCart Storefront Error Reporter.
 *
 * Mirrors backend/src/lib/error-reporter.ts so frontend and backend errors
 * land in the same monitoring sink (when wired). Without NEXT_PUBLIC_SENTRY_DSN
 * this just produces structured console.error logs that the browser DevTools
 * (and any uptime sniffer) can pick up.
 *
 * To enable Sentry on the storefront:
 *   1. `npm install @sentry/nextjs` in frontend/
 *   2. Set NEXT_PUBLIC_SENTRY_DSN in Coolify build args.
 */

type SentryBrowser = {
  init: (opts: Record<string, unknown>) => void
  captureException: (err: unknown, ctx?: Record<string, unknown>) => void
}

let sentry: SentryBrowser | null = null
let sentryInitFailed = false

function getSentry(): SentryBrowser | null {
  if (sentry || sentryInitFailed) return sentry
  if (typeof window === "undefined") return null
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@sentry/nextjs") as SentryBrowser
    mod.init({
      dsn,
      environment: process.env.NODE_ENV || "production",
      tracesSampleRate: 0.1,
    })
    sentry = mod
    return mod
  } catch {
    sentryInitFailed = true
    return null
  }
}

export interface ErrorContext {
  source?: string
  [key: string]: unknown
}

export function captureException(err: unknown, ctx: ErrorContext = {}): void {
  try {
    const payload = {
      level: "error",
      timestamp: new Date().toISOString(),
      service: "vastucart-storefront",
      error:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : { name: "NonError", message: String(err) },
      ...ctx,
    }
    // eslint-disable-next-line no-console
    console.error(payload)

    const s = getSentry()
    if (s) s.captureException(err, { extra: ctx })
  } catch {
    // eslint-disable-next-line no-console
    console.error("[error-reporter] failed:", err)
  }
}

export function captureWarning(message: string, ctx: ErrorContext = {}): void {
  try {
    // eslint-disable-next-line no-console
    console.warn({
      level: "warn",
      timestamp: new Date().toISOString(),
      service: "vastucart-storefront",
      message,
      ...ctx,
    })
  } catch {
    // ignore
  }
}
