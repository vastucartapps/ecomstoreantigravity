/**
 * VastuCart Storefront Error Reporter.
 *
 * Produces structured console.error/console.warn logs that the browser
 * DevTools (and any uptime/log sniffer) can pick up. This is the single
 * working error path today.
 *
 * Sentry is intentionally NOT wired here via a runtime `require()` — that
 * approach made a clean production build fail with "Module not found:
 * @sentry/nextjs" whenever the optional package wasn't installed (it only
 * survived on cached build layers), and it isn't how Sentry integrates with
 * Next anyway. To add Sentry properly: `npm install @sentry/nextjs`, run
 * `npx @sentry/wizard@latest -i nextjs` (creates instrumentation +
 * sentry.*.config.ts + withSentryConfig), then call its captureException from
 * captureException() below. Until then this stays dependency-free so builds
 * can never break on it.
 */

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
