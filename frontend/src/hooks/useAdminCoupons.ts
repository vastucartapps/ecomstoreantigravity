"use client"

import { useCallback } from "react"
import { adminFetch } from "@/lib/medusa"
import type {
  CouponRow,
  CouponDetail,
  CouponStatus,
  CustomerEligibility,
  GiftCardRow,
  GiftCardDetail,
  GiftCardTransaction,
  DiscountType,
  GiftCardStatus,
} from "@/types/admin-coupon"
import type {
  MedusaPromotion,
  MedusaPromotionRule,
  MedusaGiftCard,
} from "@/types/medusa-api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateGiftCardCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = "GC-"
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// ---------------------------------------------------------------------------
// Mapping: Medusa promotion → CouponRow
// ---------------------------------------------------------------------------

function mapPromotionToRow(p: MedusaPromotion): CouponRow {
  const app = p.application_method || {}
  const meta = p.metadata || {}
  const currency = (app.currency_code?.toUpperCase() || "INR") as "INR" | "USD"

  // Cast metadata values — stored as unknown in Record<string, unknown>
  const metaEndDate = meta.end_date as string | undefined
  const metaStartDate = meta.start_date as string | undefined
  const metaMinOrder = meta.min_order_value as number | undefined
  const metaMaxDiscount = meta.max_discount as number | null | undefined

  // Status
  let status: CouponStatus = "active"
  if (p.status === "inactive") status = "disabled"
  else if (p.status === "expired") status = "expired"
  else if (metaEndDate && new Date(metaEndDate) < new Date()) status = "expired"

  // Min order from native rules
  const minOrderRule = (p.rules || []).find(
    (r: MedusaPromotionRule) => r.attribute === "total" && r.operator === "gte"
  )
  const minOrder: number | null = minOrderRule
    ? parseInt(minOrderRule.values?.[0] || "0") / 100
    : metaMinOrder
    ? metaMinOrder / 100
    : null

  // Discount type and value
  const discountType: DiscountType = app.type === "fixed" ? "fixed" : "percentage"
  const discountValue =
    discountType === "fixed"
      ? Math.round(app.value || 0) / 100
      : app.value || 0

  return {
    id: p.id,
    code: p.code || "",
    discountType,
    discountValue,
    minOrder,
    maxDiscount: metaMaxDiscount ?? null,
    currency,
    startDate:
      metaStartDate || (p.created_at ? p.created_at.split("T")[0] : ""),
    endDate: metaEndDate || "",
    usageLimit: (meta.usage_limit as number | null | undefined) ?? null,
    usageLimitPerCustomer: (meta.usage_limit_per_customer as number | undefined) ?? 1,
    usedCount: p.usage_count || 0,
    status,
    targetType: ((meta.target_type as string | undefined) || "all") as "all" | "products" | "categories",
    targetNames: (meta.target_names as string[] | undefined) || [],
    customerEligibility: ((meta.customer_eligibility as string | undefined) || "all") as CustomerEligibility,
  }
}

function mapPromotionToDetail(p: MedusaPromotion): CouponDetail {
  const row = mapPromotionToRow(p)
  const meta = p.metadata || {}
  return {
    ...row,
    description: (meta.description as string | undefined) || "",
    currencyValues: (meta.currency_values as { INR: number; USD: number } | undefined) || {
      INR: row.discountValue,
      USD: row.discountValue,
    },
    targetProductIds: (meta.target_product_ids as string[] | undefined) || [],
    targetCategoryIds: (meta.target_category_ids as string[] | undefined) || [],
    createdAt: p.created_at || "",
    updatedAt: p.updated_at || "",
  }
}

// ---------------------------------------------------------------------------
// Mapping: Medusa gift card → GiftCardRow / GiftCardDetail
// ---------------------------------------------------------------------------

function mapGiftCardToRow(gc: MedusaGiftCard): GiftCardRow {
  const meta = gc.metadata || {}
  const currency = (gc.currency_code?.toUpperCase() || "INR") as "INR" | "USD"

  let status: GiftCardStatus = "active"
  if (gc.is_disabled) status = "inactive"
  else if (gc.ends_at && new Date(gc.ends_at) < new Date()) status = "expired"
  else if ((gc.balance || 0) === 0 && (gc.value || 0) > 0) status = "depleted"

  return {
    id: gc.id,
    code: gc.code || "",
    initialBalance: Math.round(((meta.initial_value as number | undefined) || gc.value || 0)) / 100,
    currentBalance: Math.round(gc.balance || 0) / 100,
    currency,
    status,
    expiresAt: gc.ends_at ? gc.ends_at.split("T")[0] : null,
    createdAt: gc.created_at || "",
  }
}

function mapGiftCardToDetail(gc: MedusaGiftCard): GiftCardDetail {
  const row = mapGiftCardToRow(gc)
  const meta = gc.metadata || {}
  return {
    ...row,
    transactions: ((meta.transactions as GiftCardTransaction[] | undefined) || []),
    customerName: null,
    customerEmail: null,
  }
}

// ---------------------------------------------------------------------------
// Build Medusa promotion payload from CouponDetail
// ---------------------------------------------------------------------------
//
// Medusa v2's POST /admin/promotions uses Zod .strict() — only fields declared
// in the schema are accepted. `metadata` is NOT in the schema; sending it
// directly causes a 400 "Unrecognized key" error.
//
// The correct pattern (per Medusa v2 docs) is:
//   • Send custom data inside `additional_data` — this IS accepted by the schema
//     via the WithAdditionalData wrapper.
//   • A workflow hook in backend/src/workflows/hooks/promotion-metadata.ts
//     picks up additional_data.metadata and persists it to the promotion's
//     metadata column after creation / update.
//
// Other fixes applied here:
//   • `apply_rules` → `target_rules` (correct field name in application_method)
//   • `allocation` only set when target_type = "items" (not for "order")
//   • `currency_code` only set for fixed-amount discounts
//   • Native `limit` field used for total usage limit (Medusa enforces this
//     server-side; we also store it in metadata for display purposes)

function buildPromotionPayload(data: Partial<CouponDetail>) {
  const currency = data.currency?.toLowerCase() || "inr"
  const isFixedDiscount = data.discountType === "fixed"
  const discountValue = isFixedDiscount
    ? Math.round((data.discountValue || 0) * 100)
    : data.discountValue || 0

  const targetType = data.targetType || "all"
  const appTargetType = targetType === "all" ? "order" : "items"

  // application_method — fields match AdminCreateApplicationMethod .strict() schema
  const appMethod: Record<string, unknown> = {
    type: isFixedDiscount ? "fixed" : "percentage",
    value: discountValue,
    target_type: appTargetType,
    // currency_code is only meaningful (and required) for fixed-amount discounts
    ...(isFixedDiscount ? { currency_code: currency } : {}),
    // allocation is only meaningful for items target_type
    ...(appTargetType === "items" ? { allocation: "across" } : {}),
  }

  // target_rules — restrict which items receive the discount (items target only)
  if (targetType === "categories" && data.targetCategoryIds?.length) {
    appMethod.target_rules = [
      {
        attribute: "product_category_id",
        operator: "in",
        values: data.targetCategoryIds,
      },
    ]
  } else if (targetType === "products" && data.targetProductIds?.length) {
    appMethod.target_rules = [
      {
        attribute: "product_id",
        operator: "in",
        values: data.targetProductIds,
      },
    ]
  }

  // Promotion-level eligibility rules (e.g. minimum order total)
  const rules: Array<Record<string, unknown>> = []
  if (data.minOrder) {
    rules.push({
      attribute: "total",
      operator: "gte",
      values: [String(Math.round(data.minOrder * 100))],
    })
  }

  return {
    code: (data.code || "").toUpperCase(),
    type: "standard",
    is_automatic: false,
    // Native Medusa usage limit — enforced server-side by Medusa's engine.
    // Only included when a limit is set; null/omitted means unlimited.
    ...(data.usageLimit ? { limit: data.usageLimit } : {}),
    application_method: appMethod,
    rules,
    // Custom fields are sent via additional_data and persisted to the
    // promotion's metadata column by the backend workflow hook.
    additional_data: {
      metadata: {
        description: data.description || "",
        max_discount: data.maxDiscount ?? null,
        start_date: data.startDate || "",
        end_date: data.endDate || "",
        usage_limit: data.usageLimit ?? null,
        usage_limit_per_customer: data.usageLimitPerCustomer ?? 1,
        target_type: targetType,
        target_product_ids: data.targetProductIds || [],
        target_category_ids: data.targetCategoryIds || [],
        target_names: data.targetNames || [],
        currency_values: data.currencyValues ?? null,
        customer_eligibility: data.customerEligibility || "all",
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminCoupons() {
  const fetchCoupons = useCallback(async (search?: string) => {
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (search) params.set("q", search)
      // +metadata requests the metadata column in addition to the default fields.
      // Medusa's default promotion fields do not include metadata; without this
      // the mapPromotionToRow mapper would see p.metadata as undefined.
      params.set("fields", "+metadata")
      const res = await adminFetch<{ promotions: MedusaPromotion[]; count?: number }>(`/admin/promotions?${params}`)
      const promotions = res.promotions || []
      return {
        coupons: promotions.map(mapPromotionToRow),
        count: res.count || promotions.length,
      }
    } catch {
      return { coupons: [], count: 0 }
    }
  }, [])

  const fetchCouponDetail = useCallback(
    async (id: string): Promise<CouponDetail | null> => {
      try {
        // +metadata — same reason as fetchCoupons above
        const res = await adminFetch<{ promotion: MedusaPromotion }>(`/admin/promotions/${id}?fields=+metadata`)
        return mapPromotionToDetail(res.promotion)
      } catch {
        return null
      }
    },
    []
  )

  // id === null means create new
  const saveCoupon = useCallback(
    async (id: string | null, data: Partial<CouponDetail>): Promise<boolean> => {
      try {
        const payload = buildPromotionPayload(data)
        if (id) {
          // Update — do not touch status here; admin uses the toggle button to
          // enable/disable. Sending status on every edit would override it.
          await adminFetch(`/admin/promotions/${id}`, {
            method: "POST",
            body: payload,
          })
        } else {
          // Create — explicitly activate so the coupon is usable immediately.
          // Medusa defaults to status: "draft" which customers cannot use.
          await adminFetch("/admin/promotions", {
            method: "POST",
            body: { ...payload, status: "active" },
          })
        }
        return true
      } catch {
        return false
      }
    },
    []
  )

  const deleteCoupon = useCallback(async (id: string): Promise<boolean> => {
    try {
      await adminFetch(`/admin/promotions/${id}`, {
        method: "DELETE",
      })
      return true
    } catch {
      return false
    }
  }, [])

  const toggleCoupon = useCallback(
    async (id: string, currentStatus: CouponStatus): Promise<boolean> => {
      try {
        const newStatus = currentStatus === "active" ? "inactive" : "active"
        await adminFetch(`/admin/promotions/${id}`, {
          method: "POST",
          body: { status: newStatus },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const fetchGiftCards = useCallback(async (search?: string) => {
    try {
      const params = new URLSearchParams({ limit: "100" })
      if (search) params.set("q", search)
      const res = await adminFetch<{ gift_cards: MedusaGiftCard[]; count?: number }>(`/admin/gift-cards?${params}`)
      const gcs = res.gift_cards || []
      return {
        giftCards: gcs.map(mapGiftCardToRow),
        count: res.count || gcs.length,
      }
    } catch {
      return { giftCards: [], count: 0 }
    }
  }, [])

  const fetchGiftCardDetail = useCallback(
    async (id: string): Promise<GiftCardDetail | null> => {
      try {
        const res = await adminFetch<{ gift_card: MedusaGiftCard }>(`/admin/gift-cards/${id}`)
        return mapGiftCardToDetail(res.gift_card)
      } catch {
        return null
      }
    },
    []
  )

  const createGiftCard = useCallback(
    async (
      balance: number,
      currency: "INR" | "USD",
      expiresAt?: string,
      code?: string
    ): Promise<boolean> => {
      try {
        const valueInMinor = Math.round(balance * 100)
        const giftCode = code || generateGiftCardCode()

        const initTransaction: GiftCardTransaction = {
          id: crypto.randomUUID(),
          type: "credit",
          amount: balance,
          currency,
          description: "Gift card created",
          orderId: null,
          date: new Date().toISOString(),
        }

        await adminFetch("/admin/gift-cards", {
          method: "POST",
          body: {
            code: giftCode,
            value: valueInMinor,
            currency_code: currency.toLowerCase(),
            is_disabled: false,
            ends_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
            metadata: {
              initial_value: valueInMinor,
              transactions: [initTransaction],
            },
          },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const toggleGiftCard = useCallback(
    async (id: string, currentStatus: GiftCardStatus): Promise<boolean> => {
      try {
        const isCurrentlyActive = currentStatus === "active"
        await adminFetch(`/admin/gift-cards/${id}`, {
          method: "POST",
          body: { is_disabled: isCurrentlyActive },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const fetchCategories = useCallback(async (): Promise<
    { id: string; name: string }[]
  > => {
    try {
      const res = await adminFetch<{ product_categories: Array<{ id: string; name: string }> }>(
        "/admin/product-categories?limit=100&fields=id,name"
      )
      return (res.product_categories || []).map((c) => ({
        id: c.id,
        name: c.name || "",
      }))
    } catch {
      return []
    }
  }, [])

  const searchProducts = useCallback(
    async (query: string): Promise<{ id: string; title: string }[]> => {
      try {
        if (!query.trim()) return []
        const params = new URLSearchParams({ q: query, limit: "20", fields: "id,title" })
        const res = await adminFetch<{ products: Array<{ id: string; title: string }> }>(`/admin/products?${params}`)
        return (res.products || []).map((p) => ({
          id: p.id,
          title: p.title || "",
        }))
      } catch {
        return []
      }
    },
    []
  )

  return {
    fetchCoupons,
    fetchCouponDetail,
    saveCoupon,
    deleteCoupon,
    toggleCoupon,
    fetchGiftCards,
    fetchGiftCardDetail,
    createGiftCard,
    toggleGiftCard,
    fetchCategories,
    searchProducts,
  }
}
