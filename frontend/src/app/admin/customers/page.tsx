"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AdminCustomerManagement } from "@/components/admin/customers"
import { useAdminCustomers } from "@/hooks/useAdminCustomers"
import type {
  CustomerRow,
  CustomerDetail,
  CustomerFilters,
} from "@/types/admin-customer"

const DEFAULT_FILTERS: CustomerFilters = {
  search: "",
  segment: "all",
  sortField: "joinedAt",
  sortDirection: "desc",
}

export default function CustomerManagementPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null)
  const [filters, setFilters] = useState<CustomerFilters>(DEFAULT_FILTERS)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const { fetchCustomers, fetchCustomerDetail, addNote } = useAdminCustomers()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadCustomers = useCallback(
    async (currentFilters: CustomerFilters) => {
      setIsLoading(true)
      try {
        const { rows, totalCount: count } = await fetchCustomers(
          currentFilters.search,
          1,
          50
        )
        setCustomers(rows)
        setTotalCount(count)
      } catch {
        showToast("Failed to load customers")
      } finally {
        setIsLoading(false)
      }
    },
    [fetchCustomers, showToast]
  )

  useEffect(() => {
    loadCustomers(DEFAULT_FILTERS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChangeFilters = useCallback(
    (partial: Partial<CustomerFilters>) => {
      setFilters(prev => {
        const next = { ...prev, ...partial }
        // Only reload from server when search changes
        if ("search" in partial) {
          loadCustomers(next)
        }
        return next
      })
    },
    [loadCustomers]
  )

  const handleViewCustomer = useCallback(
    async (id: string) => {
      setIsDetailLoading(true)
      try {
        const detail = await fetchCustomerDetail(id)
        if (detail) {
          setCustomerDetail(detail)
        } else {
          showToast("Failed to load customer details")
        }
      } catch {
        showToast("Failed to load customer details")
      } finally {
        setIsDetailLoading(false)
      }
    },
    [fetchCustomerDetail, showToast]
  )

  const handleViewOrder = useCallback(
    (orderId: string) => {
      void orderId // orderId available for future deep-linking when orders page supports URL params
      router.push("/admin/orders")
      showToast("Navigate to the Orders page to find this order")
    },
    [router, showToast]
  )

  const handleAddNote = useCallback(
    async (customerId: string, message: string) => {
      const note = await addNote(customerId, message)
      if (note) {
        // Refresh the detail to get the updated notes list
        const detail = await fetchCustomerDetail(customerId)
        if (detail) setCustomerDetail(detail)
        showToast("Note added")
      } else {
        showToast("Failed to add note")
        throw new Error("Add note failed")
      }
    },
    [addNote, fetchCustomerDetail, showToast]
  )

  const handleBackToList = useCallback(() => {
    setCustomerDetail(null)
    loadCustomers(filters)
  }, [filters, loadCustomers])

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

      <AdminCustomerManagement
        customers={customers}
        customerDetail={customerDetail}
        filters={filters}
        totalCount={totalCount}
        isLoading={isLoading}
        isDetailLoading={isDetailLoading}
        onChangeFilters={handleChangeFilters}
        onViewCustomer={handleViewCustomer}
        onViewOrder={handleViewOrder}
        onAddNote={handleAddNote}
        onBackToList={handleBackToList}
      />
    </>
  )
}
