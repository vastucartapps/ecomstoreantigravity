import { StorefrontShellWrapper } from "./shell-wrapper"
import { TrackingScripts } from "@/components/storefront/TrackingScripts"
import { CookieConsentBanner } from "@/components/storefront/CookieConsentBanner"
import { CookieConsentProvider } from "@/providers/cookie-consent-provider"
import { JsonLd } from "@/components/JsonLd"
import { buildSiteGraph } from "@/lib/schema/site-schema"
import { normalizeImageUrl } from "@/lib/image-url"
import { BRAND_URL } from "@/lib/cluster-sites"
import { fetchClusterSites, siblingUrlsFrom } from "@/lib/cluster-sites-ssr"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pubKeyHeader = {
    "x-publishable-api-key":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
  }

  // Resolve cluster sites (admin override or default seed) for DNS prefetch
  // and JSON-LD sameAs. Same fetch is shared with site-schema below.
  const clusterSites = await fetchClusterSites()
  const siblingUrls = siblingUrlsFrom(clusterSites)

  // Fetch categories, tracking config, and storefront branding in parallel
  const [categoriesRes, trackingRes, storefrontRes] = await Promise.allSettled([
    fetch(
      `${BACKEND_URL}/store/product-categories?limit=20&parent_category_id=null&fields=id,name,handle,metadata`,
      // 300s ISR; the catalog-change webhook also revalidates the root layout
      // (revalidatePath("/", "layout")) so the nav refreshes on demand.
      { headers: pubKeyHeader, next: { revalidate: 300 } }
    ),
    fetch(`${BACKEND_URL}/store/integrations-config`, {
      headers: pubKeyHeader,
      // 15s revalidation so analytics changes go live quickly after saving
      next: { revalidate: 15 },
    }),
    fetch(`${BACKEND_URL}/store/storefront-config`, {
      headers: pubKeyHeader,
      next: { revalidate: 300 },
    }),
  ])

  type RawCategory = { name: string; handle: string; metadata?: { image_url?: string; hero_image?: string } }
  let categories: { name: string; handle: string; image_url?: string }[] = []
  if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
    const data = await categoriesRes.value.json()
    categories = (data.product_categories || []).map((c: RawCategory) => ({
      name: c.name,
      handle: c.handle,
      image_url: normalizeImageUrl(c.metadata?.image_url || c.metadata?.hero_image) || undefined,
    }))
  }

  type MarketingTag = { id: string; name: string; platform: string; pixelId: string }
  let trackingConfig = { ga4: null, metaPixel: null, chatwoot: null, whatsapp: null, marketingTags: [] as MarketingTag[] }
  if (trackingRes.status === "fulfilled" && trackingRes.value.ok) {
    const data = await trackingRes.value.json()
    trackingConfig = {
      ga4: data.ga4 || null,
      metaPixel: data.metaPixel || null,
      chatwoot: data.chatwoot || null,
      whatsapp: data.whatsapp || null,
      marketingTags: data.marketingTags || [],
    }
  }

  // Build site-wide JSON-LD (Organization + WebSite) from admin branding
  let siteGraph: object
  if (storefrontRes.status === "fulfilled" && storefrontRes.value.ok) {
    const data = await storefrontRes.value.json()
    const branding = data.config?.branding
    siteGraph = buildSiteGraph({
      name: branding?.storeName,
      description: branding?.tagline,
      logoUrl: normalizeImageUrl(branding?.logoUrl) || undefined,
      socials: branding?.socialLinks,
      contact: {
        email: branding?.contactEmail,
        phone: branding?.contactPhone,
        streetAddress: branding?.streetAddress || branding?.address,
        addressLocality: branding?.addressLocality,
        addressRegion: branding?.addressRegion,
        postalCode: branding?.postalCode,
        addressCountry: branding?.addressCountry,
      },
      siblingUrls,
    })
  } else {
    siteGraph = buildSiteGraph({ siblingUrls })
  }

  return (
    <>
      {/*
        Cross-domain DNS prefetch + preconnect for the VastuCart cluster.
        URLs sourced from the single cluster-sites manifest.
      */}
      <link rel="preconnect" href={BRAND_URL} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={BRAND_URL} />
      {siblingUrls.map((url) => (
        <link key={url} rel="dns-prefetch" href={url} />
      ))}
      <JsonLd data={siteGraph} id="site-schema" />
      <CookieConsentProvider>
        <StorefrontShellWrapper categories={categories}>
          {children}
        </StorefrontShellWrapper>
        {/*
          TrackingScripts is gated on consent (GDPR / UK PECR). GA4 fires
          only with analytics consent; Meta Pixel + all marketing tags
          require marketing consent. Functional widgets (Chatwoot, WhatsApp)
          stay available regardless because the visitor must engage them.
        */}
        <TrackingScripts config={trackingConfig} />
        <CookieConsentBanner />
      </CookieConsentProvider>
    </>
  )
}
