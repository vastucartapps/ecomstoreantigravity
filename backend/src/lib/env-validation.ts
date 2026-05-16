/**
 * Validates that all required environment variables are present at startup.
 * Throws a clear, descriptive error if any are missing rather than failing
 * at runtime with a cryptic message.
 *
 * Call this at the top of medusa-config.ts.
 */
export function validateEnv(): void {
  const required: Array<{ key: string; description: string; prodOnly?: boolean }> = [
    { key: "DATABASE_URL", description: "PostgreSQL connection string" },
    { key: "REDIS_URL", description: "Redis connection string" },
    { key: "JWT_SECRET", description: "JWT signing secret (min 32 chars)" },
    { key: "COOKIE_SECRET", description: "Session cookie secret (min 32 chars)" },
    { key: "STORE_CORS", description: "Allowed origins for store API (comma-separated)" },
    { key: "ADMIN_CORS", description: "Allowed origins for admin API (comma-separated)" },
    { key: "AUTH_CORS", description: "Allowed origins for auth endpoints (comma-separated)" },
    // Required in production only — GMC/Meta status routes + support-ticket
    // emailer build absolute URLs from BACKEND_URL. Without it, code used to
    // silently fall back to a hardcoded sapi.vastucart.in which polluted any
    // staging deploy with production data.
    { key: "BACKEND_URL", description: "Public backend URL (e.g. https://sapi.vastucart.in)", prodOnly: true },
    { key: "STORE_URL", description: "Public storefront URL (e.g. https://store.vastucart.in)", prodOnly: true },
  ]

  const missing: string[] = []
  const weak: string[] = []

  const isProd = process.env.NODE_ENV === "production"
  for (const { key, description, prodOnly } of required) {
    if (prodOnly && !isProd) continue
    const value = process.env[key]
    if (!value) {
      missing.push(`  • ${key}: ${description}`)
    } else if (
      (key === "JWT_SECRET" || key === "COOKIE_SECRET") &&
      value.length < 20
    ) {
      weak.push(`  • ${key} is too short (${value.length} chars, recommend ≥ 32)`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n🚫 Missing required environment variables:\n${missing.join("\n")}\n\nSet these in your .env file or deployment environment before starting.\n`
    )
  }

  if (weak.length > 0 && process.env.NODE_ENV === "production") {
    throw new Error(
      `\n\n🚫 Insecure environment variables detected in production:\n${weak.join("\n")}\n\nUse secrets with at least 32 characters.\n`
    )
  }
}
