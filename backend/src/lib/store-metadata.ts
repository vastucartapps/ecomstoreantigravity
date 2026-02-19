/**
 * Typed accessor for store.metadata config fields.
 * Medusa v2 types store.metadata as Record<string, unknown> | null,
 * so direct property access requires casting. This module centralizes
 * the cast to a single boundary.
 */

type StoreMetadata = Record<string, unknown> | null

/** Read a top-level key from store.metadata, defaulting to `fallback` */
export function readMetaConfig<T>(
  metadata: StoreMetadata,
  key: string,
  fallback: T
): T {
  if (!metadata) return fallback
  return (metadata[key] as T) ?? fallback
}

/** Merge a config object into store.metadata (preserves existing keys) */
export function mergeMetaConfig(
  existingMetadata: StoreMetadata,
  key: string,
  value: unknown
): Record<string, unknown> {
  return { ...(existingMetadata || {}), [key]: value }
}
