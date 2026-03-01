import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { normalizeImageUrl } from "@/lib/image-url"
import ConsultationDetailClient from "./ConsultationDetailClient"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

export const dynamic = "force-dynamic"

export interface ConsultationDetailType {
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
  slug: string
}

async function fetchBySlug(slug: string): Promise<ConsultationDetailType | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/store/bookings/service-types/${slug}`, {
      headers: { "x-publishable-api-key": PUB_KEY },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.service_type ?? null
  } catch {
    return null
  }
}

/** Convert a MinIO path to a public absolute URL for OG/Twitter tags */
function toOgImageUrl(raw: string | undefined | null): string {
  if (!raw) return ""
  const normalized = normalizeImageUrl(raw)
  if (!normalized) return ""
  if (normalized.startsWith("http")) return normalized
  return `${SITE_URL}${normalized}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const s = await fetchBySlug(slug)
  if (!s) return { title: "Consultation Not Found | VastuCart" }

  const desc = s.description?.slice(0, 160) || "Expert Vastu consultation service by VastuCart certified consultants."
  const ogImage = toOgImageUrl(s.image_1)
  const pageUrl = `${SITE_URL}/consultations/${slug}`

  return {
    title: `${s.title} | Vastu Consultation — VastuCart`,
    description: desc,
    keywords: [
      s.title.toLowerCase(),
      "vastu consultation",
      "vastu expert",
      s.mode === "online" ? "online vastu consultation" : "vastu consultant near me",
      "vastu remedies",
      "vastucart",
    ],
    openGraph: {
      title: s.title,
      description: desc,
      url: pageUrl,
      type: "website",
      siteName: "VastuCart",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: s.title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: s.title,
      description: desc,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const serviceType = await fetchBySlug(slug)
  if (!serviceType) notFound()

  return <ConsultationDetailClient serviceType={serviceType} />
}
