import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public read of the operational return policy. Source of truth for the
 * footer trust ribbon, homepage trust badge, and refund-policy legal page.
 * Edits made in admin (see useAdminShipping.saveReturnPolicy) propagate
 * everywhere via this endpoint.
 *
 * Defaults match the values in our refund-policy legal page so a fresh
 * store with no admin overrides still renders consistent copy.
 */

const DEFAULT_RETURN_POLICY = {
  windowDays: 7,
  inspectionDays: "3-5",
  refundDays: "7-10",
  unboxingVideoRequired: true,
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const storeService = req.scope.resolve(Modules.STORE) as any
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    const returnPolicy =
      (store?.metadata as any)?.return_policy || DEFAULT_RETURN_POLICY
    res.json({ returnPolicy })
  } catch {
    res.json({ returnPolicy: DEFAULT_RETURN_POLICY })
  }
}
