"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AdminOrderManagement } from "@/components/admin/orders"
import { useAdminOrders } from "@/hooks/useAdminOrders"
import type {
  OrderRow,
  OrderDetail,
  OrderFilters,
  OrderStatus,
  CursorPagination,
} from "@/types/admin-order"

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDirection: "desc",
}

const DEFAULT_LIMIT = 25

const DEFAULT_CURSOR_PAG: CursorPagination = {
  limit: DEFAULT_LIMIT,
  cursor: null,
  prevCursors: [],
  nextCursor: null,
  hasMore: false,
  pageNum: 1,
  totalCount: 0,
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS)
  const [cursorPag, setCursorPag] = useState<CursorPagination>(DEFAULT_CURSOR_PAG)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchOrders,
    fetchOrderDetail,
    updateOrderStatus,
    addOrderNote,
    downloadInvoice,
    emailCustomer,
  } = useAdminOrders()

  // Keep latest values in refs for use inside callbacks
  const filtersRef = useRef(filters)
  const cursorPagRef = useRef(cursorPag)
  filtersRef.current = filters
  cursorPagRef.current = cursorPag

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  // ---------------------------------------------------------------------------
  // Core fetch
  // ---------------------------------------------------------------------------

  const loadOrders = useCallback(
    async (
      newFilters?: OrderFilters,
      cursor?: string | null,
      limit?: number,
      pageNum?: number,
      prevCursors?: Array<string | null>,
      cachedTotal?: number
    ) => {
      const f = newFilters ?? filtersRef.current
      const cur = cursor !== undefined ? cursor : cursorPagRef.current.cursor
      const lim = limit ?? cursorPagRef.current.limit
      const pn = pageNum ?? cursorPagRef.current.pageNum
      const prev = prevCursors ?? cursorPagRef.current.prevCursors

      setIsLoading(true)
      try {
        const { rows, nextCursor, hasMore, totalCount } = await fetchOrders(f, cur, lim)
        setOrders(rows)
        setCursorPag((current) => ({
          limit: lim,
          cursor: cur,
          prevCursors: prev,
          nextCursor,
          hasMore,
          pageNum: pn,
          // Keep cached totalCount across pages; update only when fetching page 1
          totalCount: cur === null && totalCount > 0 ? totalCount : (cachedTotal ?? current.totalCount),
        }))
      } catch {
        showToast("Failed to load orders")
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOrders, showToast]
  )

  // Initial load
  useEffect(() => {
    loadOrders(DEFAULT_FILTERS, null, DEFAULT_LIMIT, 1, [], 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Filter handler — always resets to page 1
  // ---------------------------------------------------------------------------

  const handleChangeFilters = useCallback(
    (partial: Partial<OrderFilters>) => {
      const newFilters = { ...filtersRef.current, ...partial }
      setFilters(newFilters)
      loadOrders(newFilters, null, cursorPagRef.current.limit, 1, [], 0)
    },
    [loadOrders]
  )

  // ---------------------------------------------------------------------------
  // Pagination handlers
  // ---------------------------------------------------------------------------

  const handleNextPage = useCallback(() => {
    const pag = cursorPagRef.current
    if (!pag.hasMore || !pag.nextCursor) return
    const newPrevCursors = [...pag.prevCursors, pag.cursor]
    loadOrders(
      filtersRef.current,
      pag.nextCursor,
      pag.limit,
      pag.pageNum + 1,
      newPrevCursors,
      pag.totalCount
    )
  }, [loadOrders])

  const handlePrevPage = useCallback(() => {
    const pag = cursorPagRef.current
    if (pag.prevCursors.length === 0) return
    const newPrev = [...pag.prevCursors]
    const prevCursor = newPrev.pop() ?? null
    loadOrders(
      filtersRef.current,
      prevCursor,
      pag.limit,
      pag.pageNum - 1,
      newPrev,
      pag.totalCount
    )
  }, [loadOrders])

  const handleChangeLimit = useCallback(
    (limit: number) => {
      loadOrders(filtersRef.current, null, limit, 1, [], 0)
    },
    [loadOrders]
  )

  // ---------------------------------------------------------------------------
  // Order detail handlers
  // ---------------------------------------------------------------------------

  const handleViewOrder = useCallback(
    async (orderId: string) => {
      setIsDetailLoading(true)
      try {
        const detail = await fetchOrderDetail(orderId)
        if (detail) {
          setOrderDetail(detail)
        } else {
          showToast("Failed to load order details")
        }
      } catch {
        showToast("Failed to load order details")
      } finally {
        setIsDetailLoading(false)
      }
    },
    [fetchOrderDetail, showToast]
  )

  const handleUpdateStatus = useCallback(
    async (
      orderId: string,
      status: OrderStatus,
      trackingNumber?: string,
      carrier?: string
    ) => {
      const ok = await updateOrderStatus(orderId, status, trackingNumber, carrier)
      if (ok) {
        const detail = await fetchOrderDetail(orderId)
        if (detail) setOrderDetail(detail)
        showToast("Order status updated")
      } else {
        showToast("Failed to update status")
      }
    },
    [updateOrderStatus, fetchOrderDetail, showToast]
  )

  const handleAddNote = useCallback(
    async (orderId: string, message: string) => {
      const note = await addOrderNote(orderId, message)
      if (note) {
        const detail = await fetchOrderDetail(orderId)
        if (detail) setOrderDetail(detail)
        showToast("Note added")
      } else {
        showToast("Failed to add note")
        throw new Error("Note add failed")
      }
    },
    [addOrderNote, fetchOrderDetail, showToast]
  )

  const handleDownloadInvoice = useCallback(
    async (orderId: string) => {
      try {
        await downloadInvoice(orderId)
        showToast("Invoice downloaded")
      } catch {
        showToast("Failed to generate invoice")
      }
    },
    [downloadInvoice, showToast]
  )

  const handleEmailCustomer = useCallback(
    async (orderId: string) => {
      if (!orderDetail || orderDetail.id !== orderId) {
        const detail = await fetchOrderDetail(orderId)
        if (detail) emailCustomer(detail)
      } else {
        emailCustomer(orderDetail)
      }
    },
    [emailCustomer, fetchOrderDetail, orderDetail]
  )

  const handleBackToList = useCallback(() => {
    setOrderDetail(null)
    loadOrders()
  }, [loadOrders])

  return (
    <>
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white"
          style={{ background: "#013f47" }}
        >
          {toast}
        </div>
      )}

      <AdminOrderManagement
        orders={orders}
        orderDetail={orderDetail}
        filters={filters}
        cursorPag={cursorPag}
        isLoading={isLoading}
        isDetailLoading={isDetailLoading}
        onChangeFilters={handleChangeFilters}
        onNextPage={handleNextPage}
        onPrevPage={handlePrevPage}
        onChangeLimit={handleChangeLimit}
        onViewOrder={handleViewOrder}
        onUpdateStatus={handleUpdateStatus}
        onAddNote={handleAddNote}
        onDownloadInvoice={handleDownloadInvoice}
        onEmailCustomer={handleEmailCustomer}
        onBackToList={handleBackToList}
      />
    </>
  )
}
