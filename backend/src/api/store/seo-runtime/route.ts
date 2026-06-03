import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getSeoRuntime } from "../../../lib/seo-runtime"

/**
 * GET /store/seo-runtime — public, non-sensitive SEO runtime values.
 * Currently the IndexNow verification key (auto-generated + stored in
 * store.metadata.seo_runtime). The storefront serves this at /indexnow-key.txt.
 * The key is a public verification token by design, so exposing it is safe.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { indexnowKey } = await getSeoRuntime(req.scope)
    res.json({ indexnowKey })
  } catch {
    res.json({ indexnowKey: "" })
  }
}
