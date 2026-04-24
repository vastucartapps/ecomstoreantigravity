import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { ABANDONED_CART_RECOVERY_MODULE } from "../modules/abandoned-cart-recovery"
import { sendTransactional, isListmonkConfigured } from "../lib/listmonk-client"
import { readMetaConfig } from "../lib/store-metadata"

/**
 * Abandoned Cart Recovery — runs every 15 minutes.
 *
 * For each cart that:
 *   - has an email set
 *   - has at least one line item
 *   - has not been completed (no order_id)
 *   - is older than STAGE_DELAYS[stage-1]
 *
 * Sends the next-stage recovery email via Listmonk and records the attempt.
 * Stages:
 *   1 — 1h  | "VC Cart Reminder 1h"
 *   2 — 24h | "VC Cart Reminder 24h"
 *   3 — 72h | "VC Cart Reminder 72h Discount" (only if admin configured a code)
 *
 * Design decisions:
 * - Recovery token is written to cart.metadata so it propagates to order.metadata
 *   on cart.complete(). The order-recovered subscriber reads it and credits
 *   the conversion to the most-recent attempt.
 * - No auto-generated per-cart promotions — admin configures one persistent
 *   recovery code in store.metadata.abandoned_cart_config.recovery_code.
 *   Keeps scope tight and avoids Medusa promotion workflow edge cases.
 * - Safe to run even when Listmonk isn't configured — it no-ops.
 */

const STAGE_DELAYS_MS = [
  60 * 60 * 1000,        // stage 1 — 1h
  24 * 60 * 60 * 1000,   // stage 2 — 24h (since stage 1 sent)
  72 * 60 * 60 * 1000,   // stage 3 — 72h (since stage 2 sent)
]

const TEMPLATES: Record<1 | 2 | 3, string> = {
  1: "VC Cart Reminder 1h",
  2: "VC Cart Reminder 24h",
  3: "VC Cart Reminder 72h Discount",
}

interface RecoveryAdminConfig {
  /** Master enable — when false, job skips all sends */
  enabled?: boolean
  /** Admin-created persistent promotion code attached to stage 3 emails */
  recovery_code?: string
  /** Optional: cap how many carts to process per tick (safety net on backlog) */
  batch_size?: number
}

async function getConfig(container: any): Promise<RecoveryAdminConfig> {
  try {
    const storeService = container.resolve(Modules.STORE)
    const stores = await storeService.listStores({}, { take: 1 })
    const store = stores?.[0]
    return readMetaConfig<RecoveryAdminConfig>(
      store?.metadata ?? null,
      "abandoned_cart_config",
      { enabled: false }
    )
  } catch {
    return { enabled: false }
  }
}

function pickStage(latestSentAt: Date | null, latestStage: number | null, cartUpdatedAt: Date): 1 | 2 | 3 | null {
  const now = Date.now()
  if (!latestStage || !latestSentAt) {
    // Never sent — eligible for stage 1 if the cart itself has been idle 1h.
    return now - cartUpdatedAt.getTime() >= STAGE_DELAYS_MS[0] ? 1 : null
  }
  const sinceLast = now - latestSentAt.getTime()
  if (latestStage === 1 && sinceLast >= STAGE_DELAYS_MS[1]) return 2
  if (latestStage === 2 && sinceLast >= STAGE_DELAYS_MS[2]) return 3
  return null
}

function storeUrl(): string {
  return (process.env.STORE_URL || "https://store.vastucart.in").replace(/\/$/, "")
}

function firstItemSummary(items: Array<{ title?: string; product_title?: string; quantity?: number }>): { count: string; summary: string } {
  if (!items?.length) return { count: "0 items", summary: "your cart" }
  const count = `${items.length} item${items.length !== 1 ? "s" : ""}`
  const names = items.slice(0, 3).map((i) => `${i.product_title || i.title || "Product"} (×${i.quantity || 1})`)
  const summary = names.join(", ") + (items.length > 3 ? ` +${items.length - 3} more` : "")
  return { count, summary }
}

function formatMoney(minor: number, currency: string): string {
  const major = (minor || 0) / 100
  const isInr = currency.toLowerCase() === "inr"
  return `${isInr ? "₹" : "$"}${major.toLocaleString(isInr ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function abandonedCartRecoveryJob(container: MedusaContainer) {
  const logger = (container as any).resolve("logger")

  if (!isListmonkConfigured()) {
    logger.debug("[abandoned-cart] Listmonk not configured – skipping")
    return
  }

  const adminConfig = await getConfig(container)
  if (adminConfig.enabled === false) {
    logger.debug("[abandoned-cart] Disabled in admin config – skipping")
    return
  }

  const batchSize = Math.max(1, Math.min(adminConfig.batch_size ?? 200, 1000))

  try {
    const cartService = (container as any).resolve(Modules.CART)
    const recoveryService = (container as any).resolve(ABANDONED_CART_RECOVERY_MODULE)

    // Candidate filter: has email, not completed, updated_at older than stage-1 threshold.
    const cutoff = new Date(Date.now() - STAGE_DELAYS_MS[0])

    const [carts] = await cartService.listAndCountCarts(
      {
        completed_at: null,
        email: { $ne: null },
        updated_at: { $lte: cutoff },
      },
      {
        take: batchSize,
        order: { updated_at: "ASC" },
        relations: ["items"],
      }
    ).catch(() => [[], 0])

    if (!carts?.length) {
      logger.debug("[abandoned-cart] No eligible carts this tick")
      return
    }

    let sent = 0
    for (const cart of carts as any[]) {
      if (!cart.email || !cart.items?.length) continue

      const latest = await recoveryService.latestForCart(cart.id)
      const stage = pickStage(
        latest?.sent_at ? new Date(latest.sent_at) : null,
        latest?.stage ?? null,
        new Date(cart.updated_at)
      )
      if (!stage) continue

      // Stage 3 without a configured recovery code still sends the urgency email
      // (we just omit the discount line in the template data)
      const isStage3 = stage === 3
      const discountCode = isStage3 ? (adminConfig.recovery_code || "") : ""

      // Create the recovery record first so we get a token to embed in the email.
      let record
      try {
        record = await recoveryService.logAttempt({
          cart_id: cart.id,
          email: cart.email,
          stage,
          discount_code: discountCode || null,
          discount_expires_at: isStage3 && discountCode
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            : null,
        })
      } catch (err: any) {
        logger.warn(`[abandoned-cart] Could not create recovery row for cart ${cart.id}: ${err.message}`)
        continue
      }

      // Stamp the token on the cart so order.metadata carries it through cart.complete()
      try {
        await cartService.updateCarts(cart.id, {
          metadata: {
            ...(cart.metadata || {}),
            abandoned_cart_recovery: {
              token: record.recovery_token,
              stage,
              sent_at: record.sent_at,
            },
          },
        })
      } catch (err: any) {
        logger.warn(`[abandoned-cart] Could not stamp token on cart ${cart.id}: ${err.message}`)
        // still try to send the email — token is in our table, attribution just
        // falls back to email-based match on recovery
      }

      const recoverUrl = `${storeUrl()}/cart/recover/${record.recovery_token}`
      const { count, summary } = firstItemSummary(cart.items || [])
      const name = (cart.shipping_address?.first_name as string) ||
        (cart.customer?.first_name as string) || "there"
      const cartTotal = formatMoney(cart.total || cart.subtotal || 0, cart.currency_code || "inr")

      try {
        await sendTransactional({
          email: cart.email,
          name,
          templateName: TEMPLATES[stage],
          subject:
            stage === 1 ? `You left something in your cart, ${name}` :
            stage === 2 ? `Still thinking about your ${count}?` :
            discountCode ? `Last chance — ${discountCode} gets you 5% off` :
                           `Your cart expires soon`,
          data: {
            customer_name: name,
            recover_url: recoverUrl,
            items_count: count,
            items_summary: summary,
            cart_total: cartTotal,
            store_url: storeUrl(),
            support_email: process.env.SUPPORT_EMAIL || "support@vastucart.in",
            ...(discountCode ? {
              discount_code: discountCode,
              discount_percent: "5",
              discount_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
            } : {}),
          },
        })
        sent += 1
      } catch (err: any) {
        logger.warn(`[abandoned-cart] Email send failed for ${cart.email} (stage ${stage}): ${err.message}`)
      }
    }

    logger.info(`[abandoned-cart] Sent ${sent} recovery email(s) this tick`)
  } catch (err: any) {
    logger.warn(`[abandoned-cart] Job error: ${err.message}`)
  }
}

export const config = {
  name: "abandoned-cart-recovery",
  schedule: "*/15 * * * *", // every 15 minutes
}
