import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_983f495c4d12fe8c760e3f167e4da827c5ac78c6534604a43446592831d4a601",
})

/**
 * Typed wrapper for admin API calls.
 *
 * Auth priority:
 *   1. `vastucart_admin_token` — dedicated admin JWT that survives customer logins.
 *      Written by auth-provider after any successful admin authentication.
 *   2. Medusa SDK's own token management (`medusa_auth_token`) — fallback for
 *      sessions where the dedicated key isn't yet populated.
 *
 * Usage:
 *   const data = await adminFetch<{ banners: Banner[] }>("/admin/ecosystem-ads/banners")
 *   // data.banners is Banner[]
 */
const BACKEND_URL = () => process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function adminFetch<T = any>(
  path: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string> }
): Promise<T> {
  if (typeof window !== "undefined") {
    const adminToken = localStorage.getItem("vastucart_admin_token")
    if (adminToken) {
      const init: RequestInit = {
        method: options?.method || "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
          ...options?.headers,
        },
      }
      if (options?.body !== undefined) {
        init.body = JSON.stringify(options.body)
      }
      const res = await fetch(`${BACKEND_URL()}${path}`, init)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(
          (errBody as { message?: string }).message || `Request failed: ${res.status}`
        )
      }
      return res.json() as Promise<T>
    }
  }

  // Fallback: let the Medusa SDK manage auth via medusa_auth_token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (medusa.client.fetch as any)(path, {
    method: options?.method || "GET",
    body: options?.body,
  }) as Promise<T>
}
