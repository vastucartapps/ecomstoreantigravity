/**
 * Central analytics event tracking — GA4 Enhanced Ecommerce + Meta Pixel.
 *
 * Fires the canonical ecommerce funnel events so GA4's Funnel Exploration
 * report can show drop-off between each step:
 *
 *   view_item → add_to_cart → view_cart → begin_checkout →
 *   add_shipping_info → add_payment_info → purchase
 *
 * Meta Pixel equivalents fire in parallel (ViewContent, AddToCart,
 * InitiateCheckout, AddPaymentInfo, Purchase) for Facebook/Instagram ads.
 *
 * Each helper is SSR-safe (guards window) and a no-op if the respective
 * tracker isn't loaded yet — the admin may not have connected GA4/Pixel,
 * or the afterInteractive script may not have mounted when a very fast
 * interaction fires. Never throws; never blocks UI.
 */

// ─── Window type augmentation ────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

// ─── Input shapes ────────────────────────────────────────────────

export interface AnalyticsItem {
  item_id: string // variant SKU or product ID
  item_name: string
  price: number // major units (rupees), not paise
  quantity?: number
  item_brand?: string
  item_category?: string
  item_variant?: string
  currency?: "INR" | "USD" | string
}

export interface ViewItemArgs {
  item: AnalyticsItem
  currency: "INR" | "USD" | string
  value: number
}

export interface ItemListArgs {
  items: AnalyticsItem[]
  listId: string
  listName: string
}

export interface CartEventArgs {
  items: AnalyticsItem[]
  currency: "INR" | "USD" | string
  value: number
  cartId?: string
}

export interface BeginCheckoutArgs extends CartEventArgs {
  coupon?: string
}

export interface ShippingArgs extends CartEventArgs {
  shippingTier?: string
}

export interface PaymentInfoArgs extends CartEventArgs {
  paymentType?: string // "razorpay" | "cod" | "stripe" | "paypal"
}

export interface PurchaseArgs extends CartEventArgs {
  transactionId: string
  tax?: number
  shipping?: number
  coupon?: string
}

export interface PaymentFailedArgs {
  transactionAttemptId?: string
  paymentType: string
  errorCode?: string
  errorMessage?: string
  value: number
  currency: string
}

// ─── Helpers ─────────────────────────────────────────────────────

function hasWindow(): boolean {
  return typeof window !== "undefined"
}

function gtag(...args: unknown[]): void {
  if (!hasWindow()) return
  if (typeof window.gtag === "function") {
    window.gtag(...args)
    return
  }
  // GA4 script not yet loaded — push to dataLayer so gtag picks it up once loaded
  if (Array.isArray(window.dataLayer)) window.dataLayer.push(args)
}

function fbq(...args: unknown[]): void {
  if (!hasWindow()) return
  if (typeof window.fbq === "function") window.fbq(...args)
}

/** GA4 expects items without `currency` per item — currency goes on the event. */
function stripItemCurrency(item: AnalyticsItem): Omit<AnalyticsItem, "currency"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { currency, ...rest } = item
  return rest
}

function normCurrency(c: string | undefined): string {
  return (c || "INR").toUpperCase()
}

// ─── Public event API ────────────────────────────────────────────

export function trackViewItem({ item, currency, value }: ViewItemArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "view_item", {
    currency: cur,
    value,
    items: [stripItemCurrency(item)],
  })
  fbq("track", "ViewContent", {
    content_ids: [item.item_id],
    content_type: "product",
    content_name: item.item_name,
    value,
    currency: cur,
  })
}

export function trackViewItemList({ items, listId, listName }: ItemListArgs): void {
  if (!items.length) return
  gtag("event", "view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: items.map(stripItemCurrency),
  })
}

export function trackSelectItem({
  item,
  listId,
  listName,
}: { item: AnalyticsItem; listId: string; listName: string }): void {
  gtag("event", "select_item", {
    item_list_id: listId,
    item_list_name: listName,
    items: [stripItemCurrency(item)],
  })
}

export function trackAddToCart({ items, currency, value }: CartEventArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "add_to_cart", {
    currency: cur,
    value,
    items: items.map(stripItemCurrency),
  })
  fbq("track", "AddToCart", {
    content_ids: items.map((i) => i.item_id),
    content_type: "product",
    value,
    currency: cur,
  })
}

export function trackRemoveFromCart({ items, currency, value }: CartEventArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "remove_from_cart", {
    currency: cur,
    value,
    items: items.map(stripItemCurrency),
  })
}

export function trackViewCart({ items, currency, value }: CartEventArgs): void {
  if (!items.length) return
  const cur = normCurrency(currency)
  gtag("event", "view_cart", {
    currency: cur,
    value,
    items: items.map(stripItemCurrency),
  })
}

export function trackBeginCheckout({
  items,
  currency,
  value,
  coupon,
}: BeginCheckoutArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "begin_checkout", {
    currency: cur,
    value,
    ...(coupon ? { coupon } : {}),
    items: items.map(stripItemCurrency),
  })
  fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.item_id),
    content_type: "product",
    num_items: items.reduce((s, i) => s + (i.quantity || 1), 0),
    value,
    currency: cur,
  })
}

export function trackAddShippingInfo({
  items,
  currency,
  value,
  shippingTier,
}: ShippingArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "add_shipping_info", {
    currency: cur,
    value,
    ...(shippingTier ? { shipping_tier: shippingTier } : {}),
    items: items.map(stripItemCurrency),
  })
}

export function trackAddPaymentInfo({
  items,
  currency,
  value,
  paymentType,
}: PaymentInfoArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "add_payment_info", {
    currency: cur,
    value,
    ...(paymentType ? { payment_type: paymentType } : {}),
    items: items.map(stripItemCurrency),
  })
  fbq("track", "AddPaymentInfo", {
    content_ids: items.map((i) => i.item_id),
    content_type: "product",
    value,
    currency: cur,
  })
}

export function trackPurchase({
  transactionId,
  items,
  currency,
  value,
  tax,
  shipping,
  coupon,
}: PurchaseArgs): void {
  const cur = normCurrency(currency)
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: cur,
    value,
    ...(tax !== undefined ? { tax } : {}),
    ...(shipping !== undefined ? { shipping } : {}),
    ...(coupon ? { coupon } : {}),
    items: items.map(stripItemCurrency),
  })
  fbq("track", "Purchase", {
    content_ids: items.map((i) => i.item_id),
    content_type: "product",
    value,
    currency: cur,
    num_items: items.reduce((s, i) => s + (i.quantity || 1), 0),
  })
}

export function trackSearch({ term, resultCount }: { term: string; resultCount?: number }): void {
  if (!term) return
  gtag("event", "search", {
    search_term: term,
    ...(resultCount !== undefined ? { results_count: resultCount } : {}),
  })
  fbq("track", "Search", { search_string: term })
}

/**
 * Custom event — distinguishes a real gateway failure from an abandonment
 * in GA4 Funnel Exploration. Pairs with backend logging via logPaymentLifecycle.
 */
export function trackPaymentFailed(args: PaymentFailedArgs): void {
  gtag("event", "payment_failed", {
    payment_type: args.paymentType,
    value: args.value,
    currency: normCurrency(args.currency),
    ...(args.errorCode ? { error_code: args.errorCode } : {}),
    ...(args.errorMessage ? { error_message: args.errorMessage } : {}),
    ...(args.transactionAttemptId ? { transaction_attempt_id: args.transactionAttemptId } : {}),
  })
}

// ─── Backend lifecycle logging (Phase 4) ─────────────────────────

export type PaymentLifecycleStage = "initiated" | "succeeded" | "failed" | "dismissed"

export interface LogPaymentLifecycleArgs {
  cartId: string
  stage: PaymentLifecycleStage
  provider: string // razorpay | stripe | paypal | cod | system | giftcard
  currency: string
  /** Minor units — paise or cents. Pass 0 if unknown. */
  amount: number
  orderId?: string
  errorCode?: string
  errorMessage?: string
  email?: string
}

/**
 * Log a payment lifecycle event to the backend so it appears in the admin
 * payment-events dashboard (funnel stats + failure breakdown).
 *
 * Fire-and-forget: never awaited, never throws. Paired with the GA4
 * trackPayment* helpers — GA4 gives realtime external visibility, this
 * gives first-party auditable history with error codes & IPs.
 */
export function logPaymentLifecycle(args: LogPaymentLifecycleArgs): void {
  if (!hasWindow()) return
  if (!args.cartId || !args.stage) return

  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
  const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
  if (!backend || !pubKey) return

  const body = {
    cart_id: args.cartId,
    stage: args.stage,
    provider: args.provider,
    currency: args.currency.toLowerCase(),
    amount: Math.max(0, Math.floor(args.amount || 0)),
    ...(args.orderId ? { order_id: args.orderId } : {}),
    ...(args.errorCode ? { error_code: args.errorCode } : {}),
    ...(args.errorMessage ? { error_message: args.errorMessage } : {}),
    ...(args.email ? { email: args.email } : {}),
  }

  // keepalive: survives page navigation (crucial for 'succeeded' which fires
  // right before router.push to order-confirmation).
  try {
    fetch(`${backend}/store/payment-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": pubKey,
      },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never throw from analytics
  }
}

// ─── Deduplication guard ─────────────────────────────────────────

const sessionFiredKeys = new Set<string>()

/**
 * Fire an event at most once per browser session (per `key`).
 * Useful for page-view events that would otherwise duplicate on re-renders
 * caused by URL param changes, fast-refresh, or React Strict Mode.
 */
export function onceInSession(key: string, fn: () => void): void {
  if (sessionFiredKeys.has(key)) return
  sessionFiredKeys.add(key)
  fn()
}

// ─── Medusa cart item → AnalyticsItem mapper ─────────────────────

export interface MedusaLineItem {
  id: string
  variant_id?: string
  product_id?: string
  title?: string
  product_title?: string
  variant_sku?: string
  variant_title?: string
  unit_price: number // minor units
  quantity: number
  product?: { categories?: Array<{ name: string }>; metadata?: Record<string, unknown> }
}

export function mapLineItems(
  items: MedusaLineItem[] | undefined | null,
  currency: string
): AnalyticsItem[] {
  if (!items?.length) return []
  return items.map((li) => ({
    item_id: li.variant_sku || li.variant_id || li.product_id || li.id,
    item_name: li.product_title || li.title || "Product",
    price: (li.unit_price || 0) / 100,
    quantity: li.quantity,
    ...(li.variant_title ? { item_variant: li.variant_title } : {}),
    ...(li.product?.categories?.[0]?.name
      ? { item_category: li.product.categories[0].name }
      : {}),
    ...(li.product?.metadata && (li.product.metadata as { merchant_centre?: { brand?: string } }).merchant_centre?.brand
      ? { item_brand: ((li.product.metadata as { merchant_centre: { brand: string } }).merchant_centre.brand) }
      : { item_brand: "VastuCart" }),
    currency,
  }))
}

export function cartTotalMajor(cart: { total?: number; currency_code?: string } | null | undefined): {
  value: number
  currency: string
} {
  return {
    value: (cart?.total || 0) / 100,
    currency: (cart?.currency_code || "inr").toUpperCase(),
  }
}
