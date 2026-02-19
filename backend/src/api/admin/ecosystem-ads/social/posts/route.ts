import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ECOSYSTEM_ADS_MODULE } from "../../../../../modules/ecosystem-ads"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const adsService = req.scope.resolve(ECOSYSTEM_ADS_MODULE) as any
    const platform = (req.query.platform as string) || undefined
    const posts = await adsService.listSocialPostsParsed(platform)
    res.json({ posts })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list posts" })
  }
}
