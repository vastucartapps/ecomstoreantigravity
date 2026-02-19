import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionService = req.scope.resolve(Modules.PROMOTION)

    const now = new Date().toISOString()
    const [promotions] = await promotionService.listAndCountPromotions(
      {
        status: ["active"],
      },
      {
        select: [
          "id",
          "code",
          "type",
          "status",
          "is_automatic",
          "campaign",
          "application_method.*",
          "rules.*",
        ],
        take: 50,
      }
    )

    // Filter out expired promotions and map to safe public shape
    const publicPromotions = promotions
      .filter((p: any) => {
        if (p.campaign?.ends_at && new Date(p.campaign.ends_at) < new Date(now)) return false
        return true
      })
      .map((p: any) => ({
        id: p.id,
        code: p.code,
        type: p.type,
        is_automatic: p.is_automatic,
        description: p.campaign?.description || "",
        application_method: p.application_method
          ? {
              type: p.application_method.type,
              value: p.application_method.value,
              target_type: p.application_method.target_type,
              currency_code: p.application_method.currency_code,
            }
          : null,
        rules: (p.rules || []).map((r: any) => ({
          attribute: r.attribute,
          operator: r.operator,
          values: r.values,
        })),
        ends_at: p.campaign?.ends_at || null,
      }))

    res.json({ promotions: publicPromotions })
  } catch (err: any) {
    res.status(500).json({ message: err?.message || "Failed to fetch promotions" })
  }
}
