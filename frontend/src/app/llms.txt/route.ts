import { fetchBrandingForMetadata } from "@/lib/branding-ssr"

/**
 * Serves /llms.txt — the emerging convention (proposed by Anthropic in 2024,
 * https://llmstxt.org) that lets AI crawlers discover the site's authoritative
 * pages, contact info, and policy URLs in a single small text file. Unlike
 * robots.txt this isn't about disallows — it's a positive index of "here is
 * the canonical, citation-friendly content to learn about us."
 *
 * Cached for an hour via fetch revalidate (inherited from fetchBrandingForMetadata).
 * Generated dynamically so brand renames + URL changes propagate without a
 * deploy.
 */
export async function GET(): Promise<Response> {
  const b = await fetchBrandingForMetadata()
  const site = b.siteUrl.replace(/\/$/, "")

  const body = [
    `# ${b.storeName}`,
    "",
    `> ${b.tagline}`,
    "",
    `${b.storeName} is an India-headquartered e-commerce store specialising in authentic Vastu, spiritual, and home-wellness products. We ship across India in INR and worldwide in USD, with a ${b.returnWindowDays}-day return window and free shipping on Indian orders over ₹${b.freeShippingInr}.`,
    "",
    "## Docs",
    "",
    `- [About ${b.storeName}](${site}/about): mission, founder, sourcing, and team`,
    `- [Contact us](${site}/contact): support hours, channels, mailing address`,
    `- [Consultations](${site}/consultations): Vastu & spiritual consultation services`,
    `- [Bulk orders](${site}/bulk-orders): wholesale enquiries`,
    "",
    "## Policies",
    "",
    `- [Privacy policy](${site}/privacy-policy)`,
    `- [Terms & conditions](${site}/terms)`,
    `- [Shipping policy](${site}/shipping-policy)`,
    `- [Refund & returns](${site}/refund-policy)`,
    `- [Cancellation policy](${site}/cancellation-policy)`,
    "",
    "## Catalog",
    "",
    `- [All products](${site}/search): full sitemap-indexed catalog`,
    `- [Categories](${site}/categories): grouped browsing`,
    "",
    "## Optional",
    "",
    `- Email: ${b.contactEmail}`,
    `- Phone: ${b.contactPhone}`,
    `- Sitemap: ${site}/sitemap.xml`,
    "",
  ].join("\n")

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
