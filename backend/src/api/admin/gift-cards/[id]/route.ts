import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GIFT_CARDS_MODULE } from "../../../../modules/gift-cards"

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
    const { id } = req.params
    const gc = await service.retrieveGiftCard(id)
    res.json({ gift_card: serializeGc(gc) })
  } catch (err: any) {
    res.status(404).json({ message: "Gift card not found" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(GIFT_CARDS_MODULE) as any
    const { id } = req.params
    const body = req.body as any

    const update: any = {}
    if (typeof body.is_disabled === "boolean") update.is_disabled = body.is_disabled
    if (body.ends_at !== undefined) update.ends_at = body.ends_at ? new Date(body.ends_at) : null
    if (body.balance !== undefined) update.balance = Math.round(Number(body.balance))
    if (body.metadata !== undefined) update.metadata_json = JSON.stringify(body.metadata)

    const gc = await service.updateGiftCards({ id, ...update })
    res.json({ gift_card: serializeGc(Array.isArray(gc) ? gc[0] : gc) })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to update gift card" })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve(GIFT_CARDS_MODULE) as any
    const { id } = req.params
    await service.deleteGiftCards(id)
    res.json({ id, deleted: true })
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Failed to delete gift card" })
  }
}
