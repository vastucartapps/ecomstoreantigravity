import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { readMetaConfig } from "../../../../lib/store-metadata"

const PLATFORM_DEFAULTS: Record<string, { label: string; preferredRatio: string }> = {
  pinterest: { label: "Pinterest", preferredRatio: "2:3" },
  instagram: { label: "Instagram", preferredRatio: "1:1" },
  facebook: { label: "Facebook", preferredRatio: "16:9" },
  twitter: { label: "Twitter / X", preferredRatio: "16:9" },
  threads: { label: "Threads", preferredRatio: "1:1" },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE)
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const socialConfig = readMetaConfig<Record<string, any>>(store?.metadata ?? null, "social_config", {})

    const accounts = Object.entries(PLATFORM_DEFAULTS).map(
      ([platform, defaults]) => {
        const platformConfig = socialConfig[platform] || {}
        const hasCredentials =
          !!platformConfig.access_token && platformConfig.access_token.length > 0

        return {
          platform,
          isConnected: hasCredentials,
          username: platformConfig.username || "",
          displayName: platformConfig.display_name || "",
          preferredRatio: defaults.preferredRatio,
        }
      }
    )

    res.json({ accounts })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list accounts" })
  }
}
