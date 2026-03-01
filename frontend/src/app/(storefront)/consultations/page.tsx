import type { Metadata } from "next"
import ConsultationsClient from "./ConsultationsClient"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const dynamic = "force-dynamic" // Always fresh — admin-managed content

export interface ServiceType {
  id: string
  title: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  image_1: string
  image_2: string
  image_3: string
  what_is_included: string
  outcomes: string
  mode: "online" | "offline" | "both"
  badge_text: string
}

async function fetchServiceTypes(): Promise<ServiceType[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/bookings/service-types`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.service_types || []
  } catch {
    return []
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const types = await fetchServiceTypes()
  const count = types.length
  const title = "Vastu Consultations | VastuCart"
  const description =
    count > 0
      ? `Book from ${count} expert Vastu consultation${count > 1 ? "s" : ""} — home, office, plot analysis. Online & in-person sessions with certified consultants.`
      : "Book expert Vastu consultation sessions with certified consultants. Online and in-person sessions available."

  const firstImage = types.find((t) => t.image_1)?.image_1 || ""
  const ogImageUrl = firstImage
    ? firstImage.includes("/medusa-uploads/")
      ? `${SITE_URL}/api/img-proxy/${firstImage.match(/\/medusa-uploads\/(.+)$/)?.[1] || ""}`
      : firstImage
    : ""

  return {
    title,
    description,
    keywords: ["vastu consultation", "vastu expert", "vastu consultant", "home vastu", "office vastu", "vastu remedies"],
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/consultations`,
      type: "website",
      siteName: "VastuCart",
      ...(ogImageUrl
        ? { images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "Vastu Consultations at VastuCart" }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
    alternates: {
      canonical: `${SITE_URL}/consultations`,
    },
  }
}

function buildJsonLd(types: ServiceType[]) {
  const services = types.map((t) => ({
    "@type": "Service",
    name: t.title,
    description: t.description || undefined,
    provider: {
      "@type": "Organization",
      name: "VastuCart",
      url: SITE_URL,
    },
    areaServed: "IN",
    serviceType: "Vastu Consultation",
    offers: t.price > 0
      ? {
          "@type": "Offer",
          price: t.price,
          priceCurrency: t.currency || "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/account/bookings?type=${t.id}`,
        }
      : {
          "@type": "Offer",
          price: 0,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
        },
  }))

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Vastu Consultation Services",
    description: "Expert Vastu consultation services by VastuCart",
    url: `${SITE_URL}/consultations`,
    numberOfItems: types.length,
    itemListElement: types.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: t.title,
        description: t.description || undefined,
        url: `${SITE_URL}/account/bookings?type=${t.id}`,
        offers: t.price > 0
          ? { "@type": "Offer", price: t.price, priceCurrency: t.currency || "INR" }
          : undefined,
      },
    })),
    // Also embed Organization breadcrumb
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Consultations", item: `${SITE_URL}/consultations` },
      ],
    },
    ...( services.length > 0 ? { offers: services } : {} ),
  }
}

export default async function ConsultationsPage() {
  const serviceTypes = await fetchServiceTypes()
  const jsonLd = buildJsonLd(serviceTypes)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ConsultationsClient serviceTypes={serviceTypes} />
    </>
  )
}
