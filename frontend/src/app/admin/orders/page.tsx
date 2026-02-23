"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { AdminOrderManagement } from "@/components/admin/orders"
import { useAdminOrders } from "@/hooks/useAdminOrders"
import type {
  OrderRow,
  OrderDetail,
  OrderFilters,
  OrderStatus,
  Pagination,
} from "@/types/admin-order"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitialDateRange() {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  return {
    dateFrom: thirtyDaysAgo.toISOString().split("T")[0],
    dateTo: today.toISOString().split("T")[0],
  }
}

const DEFAULT_FILTERS: OrderFilters = {
  search: "",
  status: "all",
  datePreset: "all",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDirection: "desc",
}

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  perPage: 25,
  totalItems: 0,
  totalPages: 0,
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [filters, setFilters] = useState<OrderFilters>(DEFAULT_FILTERS)
  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION)
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

  // Keep latest filters/pagination in refs for callbacks
  const filtersRef = useRef(filters)
  const paginationRef = useRef(pagination)
  filtersRef.current = filters
  paginationRef.current = pagination

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const loadOrders = useCallback(
    async (
      newFilters?: OrderFilters,
      newPage?: number,
      newPerPage?: number
    ) => {
      const f = newFilters ?? filtersRef.current
      const page = newPage ?? paginationRef.current.page
      const perPage = newPerPage ?? paginationRef.current.perPage

      setIsLoading(true)
      try {
        const { rows, totalCount } = await fetchOrders(f, page, perPage)
        setOrders(rows)
        setPagination({
          page,
          perPage,
          totalItems: totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / perPage)),
        })
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
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -------------------------------------------------------------------------
  // Filter / pagination handlers
  // -------------------------------------------------------------------------

  const handleChangeFilters = useCallback(
    (partial: Partial<OrderFilters>) => {
      const newFilters = { ...filtersRef.current, ...partial }
      setFilters(newFilters)
      // Reset to page 1 on filter change
      loadOrders(newFilters, 1, paginationRef.current.perPage)
    },
    [loadOrders]
  )

  const handleChangePage = useCallback(
    (page: number) => {
      if (page < 1 || page > paginationRef.current.totalPages) return
      loadOrders(filtersRef.current, page, paginationRef.current.perPage)
    },
    [loadOrders]
  )

  const handleChangePerPage = useCallback(
    (perPage: number) => {
      loadOrders(filtersRef.current, 1, perPage)
    },
    [loadOrders]
  )

  // -------------------------------------------------------------------------
  // Order detail handlers
  // -------------------------------------------------------------------------

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
        // Refresh the detail
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
        // Refresh detail to pick up the new note
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
        // Fetch if not already loaded
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
    // Refresh list when going back
    loadOrders()
  }, [loadOrders])

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

      <AdminOrderManagement
        orders={orders}
        orderDetail={orderDetail}
        filters={filters}
        pagination={pagination}
        isLoading={isLoading}
        isDetailLoading={isDetailLoading}
        onChangeFilters={handleChangeFilters}
        onChangePage={handleChangePage}
        onChangePerPage={handleChangePerPage}
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
