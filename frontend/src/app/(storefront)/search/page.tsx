import type { Metadata } from "next"
import SearchClient from "./SearchClient"
import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

/**
 * Search metadata reflects the actual query so the browser tab and any
 * non-noindex preview (social share, in-app link unfurl) shows what the user
 * searched for rather than a generic "Search Products". The route is robots
 * noindex via the parent layout, so search-engine impact is irrelevant —
 * this is purely a UX win for tabs, history, and shared links.
 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const sp = await searchParams
  const raw = sp?.q
  const query = (Array.isArray(raw) ? raw[0] : raw) || ""
  const trimmed = query.trim().slice(0, 80)
  const b = await fetchBrandingForMetadata()

  const title = trimmed
    ? `Search results for "${trimmed}" · ${b.storeName}`
    : `Search products · ${b.storeName}`
  const description = trimmed
    ? `${b.storeName} search results for "${trimmed}". Browse authentic spiritual & home-wellness products with ${b.returnWindowDays}-day returns.`
    : `Search thousands of authentic spiritual products at ${b.storeName} — crystals, yantras, incense, and more.`

  return {
    title: { absolute: title },
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: b.storeName }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  }
}

export default function SearchPage() {
  return <SearchClient />
}
