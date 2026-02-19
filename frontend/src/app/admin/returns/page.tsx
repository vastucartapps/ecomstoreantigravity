"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminReturnsRefunds } from "@/components/admin/returns"
import { useAdminReturns } from "@/hooks/useAdminReturns"
import type { ReturnCard, ReturnDetail, ReturnStatus, RefundType, RefundMethod } from "@/types/admin-return"

export default function ReturnsRefundsPage() {
  const [returns, setReturns] = useState<ReturnCard[]>([])
  const [returnDetail, setReturnDetail] = useState<ReturnDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchReturns,
    fetchReturnDetail,
    moveReturn,
    approveReturn,
    rejectReturn,
    processRefund,
    initiateExchange,
  } = useAdminReturns()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadReturns = useCallback(
    async (query = "") => {
      setIsLoading(true)
      try {
        const { cards } = await fetchReturns(query)
        setReturns(cards)
      } catch {
        showToast("Failed to load returns")
      } finally {
        setIsLoading(false)
      }
    },
    [fetchReturns, showToast]
  )

  // Initial load
  useEffect(() => {
    loadReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(
    (query: string) => {
      loadReturns(query)
    },
    [loadReturns]
  )

  const handleViewReturn = useCallback(
    async (returnId: string) => {
      setIsDetailLoading(true)
      try {
        const detail = await fetchReturnDetail(returnId)
        if (detail) {
          setReturnDetail(detail)
        } else {
          showToast("Failed to load return details")
        }
      } catch {
        showToast("Failed to load return details")
      } finally {
        setIsDetailLoading(false)
      }
    },
    [fetchReturnDetail, showToast]
  )

  const handleMoveReturn = useCallback(
    async (returnId: string, newStatus: ReturnStatus) => {
      const ok = await moveReturn(returnId, newStatus)
      if (ok) {
        // Optimistically update the card in local state
        setReturns((prev) =>
          prev.map((r) => (r.id === returnId ? { ...r, status: newStatus } : r))
        )
        showToast("Return moved")
      } else {
        showToast("Failed to move return")
      }
    },
    [moveReturn, showToast]
  )

  const handleApprove = useCallback(
    async (returnId: string, notes: string) => {
      const ok = await approveReturn(returnId, notes)
      if (ok) {
        const detail = await fetchReturnDetail(returnId)
        if (detail) setReturnDetail(detail)
        showToast("Return approved")
      } else {
        showToast("Failed to approve return")
        throw new Error("Approve failed")
      }
    },
    [approveReturn, fetchReturnDetail, showToast]
  )

  const handleReject = useCallback(
    async (returnId: string, notes: string) => {
      const ok = await rejectReturn(returnId, notes)
      if (ok) {
        const detail = await fetchReturnDetail(returnId)
        if (detail) setReturnDetail(detail)
        showToast("Return rejected")
      } else {
        showToast("Failed to reject return")
        throw new Error("Reject failed")
      }
    },
    [rejectReturn, fetchReturnDetail, showToast]
  )

  const handleProcessRefund = useCallback(
    async (
      returnId: string,
      type: RefundType,
      amount: number,
      method: RefundMethod
    ): Promise<{ success: boolean; giftCardCode?: string }> => {
      // Get orderId and paymentCollectionId from current detail
      const orderId = returnDetail?.orderId || ""
      const paymentCollectionId = returnDetail?.paymentCollectionId || null

      const result = await processRefund(returnId, type, amount, method, orderId, paymentCollectionId)
      if (result.success) {
        const detail = await fetchReturnDetail(returnId)
        if (detail) setReturnDetail(detail)
        if (result.giftCardCode) {
          showToast(`Store credit issued — Gift card: ${result.giftCardCode}`)
        } else {
          showToast("Refund processed successfully")
        }
      } else {
        showToast("Failed to process refund")
      }
      return result
    },
    [processRefund, fetchReturnDetail, returnDetail, showToast]
  )

  const handleInitiateExchange = useCallback(
    async (returnId: string) => {
      const orderId = returnDetail?.orderId || ""
      const returnItemIds = returnDetail?.returnItemIds || []
      const ok = await initiateExchange(returnId, orderId, returnItemIds)
      if (ok) {
        showToast("Exchange initiated successfully")
      } else {
        showToast("Failed to initiate exchange")
        throw new Error("Exchange failed")
      }
    },
    [initiateExchange, returnDetail, showToast]
  )

  const handleBackToBoard = useCallback(() => {
    setReturnDetail(null)
    loadReturns()
  }, [loadReturns])

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white"
          style={{ background: "#013f47" }}
        >
          {toast}
        </div>
      )}

      <AdminReturnsRefunds
        returns={returns}
        returnDetail={returnDetail}
        isLoading={isLoading}
        isDetailLoading={isDetailLoading}
        onViewReturn={handleViewReturn}
        onMoveReturn={handleMoveReturn}
        onSearch={handleSearch}
        onApprove={handleApprove}
        onReject={handleReject}
        onProcessRefund={handleProcessRefund}
        onInitiateExchange={handleInitiateExchange}
        onBackToBoard={handleBackToBoard}
      />
    </>
  )
}
