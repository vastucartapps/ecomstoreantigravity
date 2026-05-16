/**
 * Validates that all required environment variables are present at startup.
 * Throws a clear, descriptive error if any are missing rather than failing
 * at runtime with a cryptic message.
 *
 * Call this at the top of medusa-config.ts.
 */
export function validateEnv(): void {
  // Two tiers of env vars:
  //   - hardRequired: missing = throw (container won't boot — these are fatal)
  //   - softRequired: missing = warn loudly (boot succeeds; specific features
  //     degrade with a clear error at call time instead of taking down the
  //     entire backend on a single env-var omission)
  //
  // Keeping BACKEND_URL/STORE_URL soft prevents a missing public-URL env from
  // killing the whole deploy. With the prior hardcoded sapi.vastucart.in
  // fallback already removed (P1.7), the worst case if these are unset is
  // that GMC status + cart-recovery links serve relative URLs, which is
  // recoverable; that's strictly better than the whole backend refusing to
  // start because the admin forgot one env var.
  const hardRequired: Array<{ key: string; description: string }> = [
    { key: "DATABASE_URL", description: "PostgreSQL connection string" },
    { key: "REDIS_URL", description: "Redis connection string" },
    { key: "JWT_SECRET", description: "JWT signing secret (min 32 chars)" },
    { key: "COOKIE_SECRET", description: "Session cookie secret (min 32 chars)" },
    { key: "STORE_CORS", description: "Allowed origins for store API (comma-separated)" },
    { key: "ADMIN_CORS", description: "Allowed origins for admin API (comma-separated)" },
    { key: "AUTH_CORS", description: "Allowed origins for auth endpoints (comma-separated)" },
  ]
  const softRequired: Array<{ key: string; description: string; prodOnly?: boolean }> = [
    { key: "BACKEND_URL", description: "Public backend URL (e.g. https://sapi.vastucart.in)", prodOnly: true },
    { key: "STORE_URL", description: "Public storefront URL (e.g. https://store.vastucart.in)", prodOnly: true },
  ]

  const isProd = process.env.NODE_ENV === "production"
  const missing: string[] = []
  const weak: string[] = []
  const softMissing: string[] = []

  for (const { key, description } of hardRequired) {
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

  for (const { key, description, prodOnly } of softRequired) {
    if (prodOnly && !isProd) continue
    if (!process.env[key]) {
      softMissing.push(`  • ${key}: ${description}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `\n\n🚫 Missing required environment variables:\n${missing.join("\n")}\n\nSet these in your .env file or deployment environment before starting.\n`
    )
  }

  if (weak.length > 0 && isProd) {
    throw new Error(
      `\n\n🚫 Insecure environment variables detected in production:\n${weak.join("\n")}\n\nUse secrets with at least 32 characters.\n`
    )
  }

  if (softMissing.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `\n⚠️  Recommended environment variables missing (boot continues, but some features degrade):\n${softMissing.join("\n")}\n`
    )
  }
}
