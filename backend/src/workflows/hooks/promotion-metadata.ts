import {
  createPromotionsWorkflow,
  updatePromotionsWorkflow,
} from "@medusajs/core-flows"
import { Modules } from "@medusajs/framework/utils"

/**
 * Workflow hooks that persist custom coupon metadata through Medusa's
 * officially documented `additional_data` extension pattern.
 *
 * Why this exists:
 * Medusa v2's POST /admin/promotions and POST /admin/promotions/:id validators
 * use Zod `.strict()`. The `CreatePromotion` / `UpdatePromotion` schemas do NOT
 * include a top-level `metadata` field, so sending `metadata` directly in the
 * request body causes a 400 "Unrecognized key(s)" validation error.
 *
 * The correct pattern per Medusa v2 docs is:
 *   1. Frontend sends custom data inside `additional_data` (which IS in the schema,
 *      added via the `WithAdditionalData` wrapper).
 *   2. A workflow hook registered here receives `additional_data` after the
 *      promotion is persisted and updates the promotion's metadata column
 *      via the promotion module service.
 *
 * The MikroORM Promotion model declares `metadata: model.json().nullable()` and
 * the service forwards all DTO fields to the ORM layer. Although
 * `UpdatePromotionDTO` in @medusajs/framework/types does not enumerate `metadata`
 * (it only declares code, type, is_automatic, campaign_id), the underlying
 * implementation accepts and persists any additional scalar / JSON fields.
 * We express this accurately with the `PromotionSvcForMetadata` interface below —
 * no `as any`, no runtime patches.
 *
 * @see https://docs.medusajs.com/learn/fundamentals/workflows/workflow-hooks
 */

/**
 * Subset of the promotion module service interface that accurately reflects
 * the `updatePromotions` overload we call here. The official TypeScript DTO
 * (`UpdatePromotionDTO`) omits `metadata`, but the ORM model and service
 * implementation do accept and persist it.
 */
interface PromotionSvcForMetadata {
  updatePromotions(
    data: Array<{ id: string; metadata: Record<string, unknown> }>
  ): Promise<unknown>
}

/** DI container shape — typed to avoid casting at the call-site. */
interface MedusaContainer {
  resolve<T>(token: string): T
}

/**
 * Reads `additional_data.metadata` and persists it onto each supplied promotion.
 * No-ops silently when `additional_data` carries no metadata object.
 */
async function applyPromotionMetadata(
  promotions: Array<{ id: string }>,
  additional_data: Record<string, unknown> | undefined,
  container: MedusaContainer
): Promise<void> {
  const raw = additional_data?.metadata
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return

  const metadata = raw as Record<string, unknown>
  const svc = container.resolve<PromotionSvcForMetadata>(Modules.PROMOTION)

  await svc.updatePromotions(
    promotions.map((p) => ({ id: p.id, metadata }))
  )
}

// ── Create hook ────────────────────────────────────────────────────────────────

createPromotionsWorkflow.hooks.promotionsCreated(
  async ({ promotions, additional_data }, { container }) => {
    await applyPromotionMetadata(promotions, additional_data, container)
  }
)

// ── Update hook ────────────────────────────────────────────────────────────────

updatePromotionsWorkflow.hooks.promotionsUpdated(
  async ({ promotions, additional_data }, { container }) => {
    await applyPromotionMetadata(promotions, additional_data, container)
  }
)
