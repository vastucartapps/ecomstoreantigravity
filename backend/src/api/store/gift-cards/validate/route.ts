import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARDS_MODULE } from "../../../../modules/gift-cards"

/**
 * GET /store/gift-cards/validate?code=XXX
 *
 * Public. Validates a gift card code and returns its balance.
 * Does NOT deduct. Does NOT require auth.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { code } = req.query as Record<string, string>
  if (!code) return res.status(400).json({ message: "code is required" })

  const service = req.scope.resolve(GIFT_CARDS_MODULE) as any
  const [gcs] = await service.listAndCountGiftCards(
    { code: code.trim().toUpperCase() },
    { take: 1 }
  ).catch(() => [[], 0])

  const gc = (gcs as any[])[0]

  if (!gc) return res.status(404).json({ message: "Gift card not found" })
  if (gc.is_disabled) return res.status(400).json({ message: "Gift card is disabled" })
  if (gc.ends_at && new Date(gc.ends_at) < new Date()) {
    return res.status(400).json({ message: "Gift card has expired" })
  }
  if (gc.balance <= 0) return res.status(400).json({ message: "Gift card balance is depleted" })

  res.json({
    gift_card: {
      id: gc.id,
      code: gc.code,
      balance: gc.balance,
      value: gc.value,
      currency_code: gc.currency_code,
      ends_at: gc.ends_at,
    },
  })
}
