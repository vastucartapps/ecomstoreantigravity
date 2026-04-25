/**
 * Resolve cluster sites with admin override layered over the default seed.
 *
 * Used by every consumer of the brand cluster:
 *  - `app/robots.ts` (sitemap discovery)
 *  - `app/(storefront)/layout.tsx` (DNS prefetch)
 *  - `lib/schema/site-schema.ts` via the storefront layout (Organization sameAs)
 *  - `components/shell/StorefrontShell.tsx` (footer cards) — via client hook
 *
 * Precedence:
 *  1. `store.metadata.storefront_config.clusterSites` (admin canonical)
 *  2. `CLUSTER_SITES` from `lib/cluster-sites.ts` (default seed)
 *
 * The fetch is cached via Next's fetch revalidate so admin edits propagate
 * to the next render after the cache window expires (default 5 min).
 */

import { CLUSTER_SITES, type ClusterSite } from "@/lib/cluster-sites"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Server-side fetch that returns the admin-override cluster sites if any
 * are saved, or the hardcoded defaults otherwise. Safe to call from any
 * server component, route handler, or `generateMetadata`.
 */
export async function fetchClusterSites(): Promise<readonly ClusterSite[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/storefront-config`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      const saved = data?.config?.clusterSites
      if (Array.isArray(saved) && saved.length > 0) {
        return saved as ClusterSite[]
      }
    }
  } catch {
    // Defaults below
  }
  return CLUSTER_SITES
}

/** Sibling URLs only (excludes the current site card). */
export function siblingUrlsFrom(sites: readonly ClusterSite[]): string[] {
  return sites.filter((s) => !s.isCurrent).map((s) => s.url)
}

/** Sitemap URLs for every cluster site + the parent brand. */
export function clusterSitemapsFrom(
  sites: readonly ClusterSite[],
  brandUrl: string
): string[] {
  return [`${brandUrl}/sitemap.xml`, ...sites.map((s) => `${s.url}/sitemap.xml`)]
}
