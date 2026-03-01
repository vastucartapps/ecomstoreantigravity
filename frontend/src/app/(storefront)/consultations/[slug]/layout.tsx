import type { Metadata } from "next"
import type { ReactNode } from "react"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return {
    alternates: {
      canonical: `${SITE_URL}/consultations/${slug}`,
    },
  }
}

export default function ConsultationSlugLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
