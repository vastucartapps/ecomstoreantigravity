"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminCouponsGiftCards } from "@/components/admin/coupons"
import { useAdminCoupons } from "@/hooks/useAdminCoupons"
import type {
  CouponRow,
  CouponDetail,
  CouponStatus,
  GiftCardRow,
  GiftCardDetail,
  GiftCardStatus,
  CouponsGiftCardsTab,
} from "@/types/admin-coupon"

// Empty coupon used for the "create new" form state
const EMPTY_COUPON: CouponDetail = {
  id: "",
  code: "",
  discountType: "percentage",
  discountValue: 0,
  minOrder: null,
  maxDiscount: null,
  currency: "INR",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  usageLimit: null,
  usageLimitPerCustomer: 1,
  usedCount: 0,
  status: "active",
  targetType: "all",
  targetNames: [],
  customerEligibility: "all",
  description: "",
  currencyValues: { INR: 0, USD: 0 },
  targetProductIds: [],
  targetCategoryIds: [],
  createdAt: "",
  updatedAt: "",
}

export default function CouponsPage() {
  const router = useRouter()
  const {
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
  } = useAdminCoupons()

  const [coupons, setCoupons] = useState<CouponRow[]>([])
  const [giftCards, setGiftCards] = useState<GiftCardRow[]>([])
  const [editingCoupon, setEditingCoupon] = useState<CouponDetail | null>(null)
  const [giftCardDetail, setGiftCardDetail] = useState<GiftCardDetail | null>(null)
  const [activeTab, setActiveTab] = useState<CouponsGiftCardsTab>("coupons")
  const [couponStatusFilter, setCouponStatusFilter] = useState<CouponStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadCoupons = useCallback(async (search?: string) => {
    const { coupons: rows } = await fetchCoupons(search)
    setCoupons(rows)
  }, [fetchCoupons])

  const loadGiftCards = useCallback(async (search?: string) => {
    const { giftCards: rows } = await fetchGiftCards(search)
    setGiftCards(rows)
  }, [fetchGiftCards])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [, , cats] = await Promise.all([
        loadCoupons(),
        loadGiftCards(),
        fetchCategories(),
      ])
      setCategories(cats)
    } finally {
      setIsLoading(false)
    }
  }, [loadCoupons, loadGiftCards, fetchCategories])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Tab =====

  const handleChangeTab = useCallback((tab: CouponsGiftCardsTab) => {
    setActiveTab(tab)
    setSearchQuery("")
    setGiftCardDetail(null)
  }, [])

  // ===== Search =====

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query)
      if (activeTab === "coupons") {
        loadCoupons(query)
      } else {
        loadGiftCards(query)
      }
    },
    [activeTab, loadCoupons, loadGiftCards]
  )

  // ===== Coupons =====

  const handleCreateCoupon = useCallback(() => {
    setEditingCoupon(EMPTY_COUPON)
  }, [])

  const handleEditCoupon = useCallback(
    async (couponId: string) => {
      setIsSaving(true) // reuse loading flag while fetching detail
      const detail = await fetchCouponDetail(couponId)
      setIsSaving(false)
      if (detail) {
        setEditingCoupon(detail)
      } else {
        showToast("Failed to load coupon details")
      }
    },
    [fetchCouponDetail, showToast]
  )

  const handleSaveCoupon = useCallback(
    async (data: Partial<CouponDetail>) => {
      const couponId = editingCoupon?.id || null // null = create
      setIsSaving(true)
      const ok = await saveCoupon(couponId, data)
      setIsSaving(false)
      if (ok) {
        setEditingCoupon(null)
        await loadCoupons()
        showToast(couponId ? "Coupon updated" : "Coupon created")
      } else {
        showToast("Failed to save coupon")
        throw new Error("Save failed")
      }
    },
    [editingCoupon, saveCoupon, loadCoupons, showToast]
  )

  const handleDeleteCoupon = useCallback(
    async (couponId: string) => {
      const ok = await deleteCoupon(couponId)
      if (ok) {
        setCoupons((prev) => prev.filter((c) => c.id !== couponId))
        showToast("Coupon deleted")
      } else {
        showToast("Failed to delete coupon")
        throw new Error("Delete failed")
      }
    },
    [deleteCoupon, showToast]
  )

  const handleToggleCoupon = useCallback(
    async (couponId: string) => {
      const coupon = coupons.find((c) => c.id === couponId)
      if (!coupon) return
      const ok = await toggleCoupon(couponId, coupon.status)
      if (ok) {
        const newStatus: CouponStatus =
          coupon.status === "active" ? "disabled" : "active"
        setCoupons((prev) =>
          prev.map((c) => (c.id === couponId ? { ...c, status: newStatus } : c))
        )
        showToast(`Coupon ${newStatus === "active" ? "enabled" : "disabled"}`)
      } else {
        showToast("Failed to update coupon status")
        throw new Error("Toggle failed")
      }
    },
    [coupons, toggleCoupon, showToast]
  )

  // ===== Gift Cards =====

  const handleViewGiftCard = useCallback(
    async (giftCardId: string) => {
      setIsLoading(true)
      const detail = await fetchGiftCardDetail(giftCardId)
      setIsLoading(false)
      if (detail) {
        setGiftCardDetail(detail)
      } else {
        showToast("Failed to load gift card details")
      }
    },
    [fetchGiftCardDetail, showToast]
  )

  const handleCreateGiftCard = useCallback(
    async (
      balance: number,
      currency: "INR" | "USD",
      code?: string
    ) => {
      const ok = await createGiftCard(balance, currency, code)
      if (ok) {
        await loadGiftCards()
        showToast("Gift card created")
      } else {
        showToast("Failed to create gift card")
        throw new Error("Create failed")
      }
    },
    [createGiftCard, loadGiftCards, showToast]
  )

  const handleToggleGiftCard = useCallback(
    async (giftCardId: string) => {
      const gc = giftCards.find((g) => g.id === giftCardId)
      if (!gc) return
      const ok = await toggleGiftCard(giftCardId, gc.status)
      if (ok) {
        const newStatus: GiftCardStatus =
          gc.status === "active" ? "inactive" : "active"
        setGiftCards((prev) =>
          prev.map((g) => (g.id === giftCardId ? { ...g, status: newStatus } : g))
        )
        // Also update detail if viewing
        if (giftCardDetail?.id === giftCardId) {
          setGiftCardDetail((prev) => prev ? { ...prev, status: newStatus } : prev)
        }
        showToast(`Gift card ${newStatus === "active" ? "activated" : "deactivated"}`)
      } else {
        showToast("Failed to update gift card status")
        throw new Error("Toggle failed")
      }
    },
    [giftCards, giftCardDetail, toggleGiftCard, showToast]
  )

  const handleViewOrder = useCallback(
    (orderId: string) => {
      showToast(`Navigate to Orders and search for order #${orderId.slice(0, 8)}`)
      router.push("/admin/orders")
    },
    [router, showToast]
  )

  return (
    <>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: "#013f47",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxWidth: "320px",
          }}
        >
          {toast}
        </div>
      )}

      <AdminCouponsGiftCards
        coupons={coupons}
        giftCards={giftCards}
        editingCoupon={editingCoupon}
        giftCardDetail={giftCardDetail}
        activeTab={activeTab}
        couponStatusFilter={couponStatusFilter}
        searchQuery={searchQuery}
        isLoading={isLoading}
        isSaving={isSaving}
        categories={categories}
        onChangeTab={handleChangeTab}
        onChangeCouponStatus={setCouponStatusFilter}
        onSearch={handleSearch}
        onCreateCoupon={handleCreateCoupon}
        onEditCoupon={handleEditCoupon}
        onDeleteCoupon={handleDeleteCoupon}
        onToggleCoupon={handleToggleCoupon}
        onSaveCoupon={handleSaveCoupon}
        onCancelCouponEdit={() => setEditingCoupon(null)}
        onCreateGiftCard={handleCreateGiftCard}
        onViewGiftCard={handleViewGiftCard}
        onToggleGiftCard={handleToggleGiftCard}
        onBackFromGiftCard={() => setGiftCardDetail(null)}
        onViewOrder={handleViewOrder}
        onSearchProducts={searchProducts}
      />
    </>
  )
}
