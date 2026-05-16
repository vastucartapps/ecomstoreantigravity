/**
 * Tiny async retry helper used by notification subscribers + outbound webhook
 * calls. Linear-then-exponential backoff (1s → 2s → 4s, capped at 5 attempts)
 * absorbs the most common transient failures — DNS blips, rate-limit 429s,
 * idle-connection 502s from API gateways — without blocking the worker for
 * minutes on a permanently broken endpoint.
 *
 * NOT for use on operations with side effects that can't safely repeat —
 * e.g. payment captures or any "create" that lacks an idempotency key.
 *
 *   await retry(() => fetch("https://api.example.com/send"), {
 *     attempts: 4,
 *     baseDelayMs: 500,
 *     onAttempt: (n, err) => logger.warn(`notify retry ${n}: ${err.message}`),
 *   })
 */

export interface RetryOptions {
  /** Total attempts including the first try. Default 3. Clamped to [1, 10]. */
  attempts?: number
  /** Base delay before retry #2; subsequent retries double it. Default 500ms. */
  baseDelayMs?: number
  /** Cap on per-retry sleep. Default 8s. */
  maxDelayMs?: number
  /** Called before each retry (not before the first attempt). */
  onAttempt?: (attempt: number, lastError: unknown) => void
  /** Return false to stop retrying for a given error (e.g. 4xx). Default: always retry. */
  shouldRetry?: (err: unknown) => boolean
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const attempts = Math.max(1, Math.min(10, opts.attempts ?? 3))
  const baseDelayMs = Math.max(50, opts.baseDelayMs ?? 500)
  const maxDelayMs = Math.max(baseDelayMs, opts.maxDelayMs ?? 8000)

  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const isLast = i === attempts - 1
      const giveUp = opts.shouldRetry ? !opts.shouldRetry(err) : false
      if (isLast || giveUp) throw err
      const delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, i))
      opts.onAttempt?.(i + 1, err)
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  // Unreachable — the loop either returns or throws.
  throw lastErr
}
