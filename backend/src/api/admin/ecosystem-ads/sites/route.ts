import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const sites = await adsService.listSitesWithSlots()
    res.json({ sites })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list sites" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const body = req.body as any

    const site = await adsService.createEcosystemSites({
      subdomain: body.subdomain || "",
      display_name: body.display_name || "",
      is_active: body.is_active ?? true,
    })

    res.status(201).json({ site })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create site" })
  }
}
