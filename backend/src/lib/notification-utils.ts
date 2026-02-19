/**
 * Substitutes {{variable_name}} placeholders in a template string.
 * Unknown variables are left as-is.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : match
  })
}

/**
 * Fetches notifications_config from store metadata.
 * Returns null if not configured.
 */
export async function getNotificationsConfig(container: any): Promise<any | null> {
  try {
    const storeService = container.resolve("storeModuleService") as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    return (store?.metadata as any)?.notifications_config ?? null
  } catch {
    return null
  }
}

/**
 * Finds an active template by triggerEvent from a templates array.
 * Returns the template if found and active, null otherwise.
 */
export function findActiveTemplate(
  templates: any[],
  triggerEvent: string
): any | null {
  if (!Array.isArray(templates)) return null
  return templates.find((t) => t.triggerEvent === triggerEvent && t.isActive) ?? null
}
