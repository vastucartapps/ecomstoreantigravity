import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARDS_MODULE } from "../../../modules/gift-cards"

function safeJson(s: string | null | undefined): any {
  if (!s) return null
  try { return JSON.parse(s) } catch { return null }
}

function serializeGc(gc: any) {
  return {
    id: gc.id,
    code: gc.code,
    value: gc.value,
    balance: gc.balance,
    currency_code: gc.currency_code,
    is_disabled: gc.is_disabled,
    ends_at: gc.ends_at,
    created_at: gc.created_at,
    updated_at: gc.updated_at,
    metadata: safeJson(gc.metadata_json) ?? {},
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(GIFT_CARDS_MODULE) as any
    const { q, limit = "100", offset = "0" } = req.query as Record<string, string>

    const take = Math.min(parseInt(limit) || 100, 500)
    const skip = parseInt(offset) || 0
    const filter: any = {}
    if (q) filter.code = { $ilike: `%${q}%` }

    const [giftCards, count] = await service.listAndCountGiftCards(filter, {
      order: { created_at: "DESC" },
      take,
      skip,
    })

    res.json({ gift_cards: giftCards.map(serializeGc), count })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to list gift cards" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(GIFT_CARDS_MODULE) as any
    const body = req.body as any
    const {
      code,
      value,
      currency_code = "inr",
      is_disabled = false,
      ends_at,
      metadata,
    } = body

    if (!code || !value) {
      res.status(400).json({ message: "code and value are required" })
      return
    }

    const gc = await service.createGiftCards({
      code: String(code).toUpperCase(),
      value: Math.round(Number(value)),
      balance: Math.round(Number(value)),
      currency_code: String(currency_code).toLowerCase(),
      is_disabled: Boolean(is_disabled),
      ends_at: ends_at ? new Date(ends_at) : null,
      metadata_json: metadata ? JSON.stringify(metadata) : null,
    })

    res.status(201).json({ gift_card: serializeGc(gc) })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to create gift card" })
  }
}
