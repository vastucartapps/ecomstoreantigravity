import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

/**
 * Typed wrapper for admin API calls via the Medusa JS SDK's internal fetch.
 * Eliminates `(medusa.client.fetch as Function)` casts throughout admin hooks.
 *
 * Usage:
 *   const data = await adminFetch<{ banners: Banner[] }>("/admin/ecosystem-ads/banners")
 *   // data.banners is Banner[]
 *
 * Without generic, returns `any` for backward compatibility with existing hooks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function adminFetch<T = any>(
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (medusa.client.fetch as any)(path, {
    method: options?.method || "GET",
    body: options?.body,
  }) as Promise<T>
}
