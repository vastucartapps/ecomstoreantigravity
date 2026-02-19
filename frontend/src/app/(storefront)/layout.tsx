import { StorefrontShellWrapper } from "./shell-wrapper"
import { TrackingScripts } from "@/components/storefront/TrackingScripts"

const BACKEND_URL =
  process.env.MEDUSA_INTERNAL_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch categories and tracking config in parallel
  const [categoriesRes, trackingRes] = await Promise.allSettled([
    fetch(
      `${BACKEND_URL}/store/product-categories?limit=20&parent_category_id=null&fields=id,name,handle`,
      {
        headers: {
          "x-publishable-api-key":
            process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
        },
        next: { revalidate: 300 },
      }
    ),
    fetch(`${BACKEND_URL}/store/integrations-config`, {
      next: { revalidate: 600 },
    }),
  ])

  let categories: { name: string; handle: string }[] = []
  if (categoriesRes.status === "fulfilled" && categoriesRes.value.ok) {
    const data = await categoriesRes.value.json()
    categories = (data.product_categories || []).map((c: any) => ({
      name: c.name,
      handle: c.handle,
    }))
  }

  let trackingConfig = { ga4: null, metaPixel: null, chatwoot: null }
  if (trackingRes.status === "fulfilled" && trackingRes.value.ok) {
    const data = await trackingRes.value.json()
    trackingConfig = {
      ga4: data.ga4 || null,
      metaPixel: data.metaPixel || null,
      chatwoot: data.chatwoot || null,
    }
  }

  return (
    <>
      <StorefrontShellWrapper categories={categories}>
        {children}
      </StorefrontShellWrapper>
      <TrackingScripts config={trackingConfig} />
    </>
  )
}
