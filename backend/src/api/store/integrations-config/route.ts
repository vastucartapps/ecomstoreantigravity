import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public route — returns only the public-safe integration fields needed for
 * storefront script injection and SEO meta tags.
 *
 * NEVER exposes sensitive fields: conversionApiToken, apiKey, apiSecret.
 */

const SENSITIVE_FIELDS = new Set([
  "conversionApiToken",
  "apiKey",
  "apiSecret",
  "accessToken",
])

function stripSensitive(fields: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {}
  for (const [k, v] of Object.entries(fields || {})) {
    if (!SENSITIVE_FIELDS.has(k)) safe[k] = v
  }
  return safe
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const cfg = (store?.metadata as any)?.integrations_config

    if (!cfg) {
      return res.json({
        ga4: null,
        metaPixel: null,
        chatwoot: null,
        seoDefaults: null,
        openGraph: null,
      })
    }

    const integrations: any[] = cfg.integrations || []

    const findIntegration = (id: string) =>
      integrations.find((i: any) => i.id === id)

    const ga4Raw = findIntegration("ga4")
    const pixelRaw = findIntegration("meta-pixel")
    const chatwootRaw = findIntegration("chatwoot")
    const whatsappRaw = findIntegration("whatsapp")

    // Active marketing tags — strip-sensitive (pixelId is always public)
    const marketingTags = (cfg.marketingTags || [])
      .filter((t: any) => t.isActive && t.pixelId)
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        platform: t.platform,
        pixelId: t.pixelId,
      }))

    res.json({
      ga4:
        ga4Raw?.isConnected && ga4Raw.configFields?.measurementId
          ? {
              isConnected: true,
              measurementId: ga4Raw.configFields.measurementId,
            }
          : null,
      metaPixel:
        pixelRaw?.isConnected && pixelRaw.configFields?.pixelId
          ? {
              isConnected: true,
              pixelId: pixelRaw.configFields.pixelId,
            }
          : null,
      chatwoot:
        chatwootRaw?.isConnected && chatwootRaw.configFields?.websiteToken
          ? {
              isConnected: true,
              websiteToken: chatwootRaw.configFields.websiteToken,
              baseUrl:
                chatwootRaw.configFields.baseUrl ||
                "https://app.chatwoot.com",
            }
          : null,
      whatsapp:
        whatsappRaw?.isConnected && whatsappRaw.configFields?.phoneNumber
          ? {
              isConnected: true,
              phoneNumber: whatsappRaw.configFields.phoneNumber,
            }
          : null,
      marketingTags,
      seoDefaults: cfg.seoDefaults || null,
      openGraph: cfg.openGraph || null,
    })
  } catch {
    res.json({
      ga4: null,
      metaPixel: null,
      chatwoot: null,
      whatsapp: null,
      marketingTags: [],
      seoDefaults: null,
      openGraph: null,
    })
  }
}
