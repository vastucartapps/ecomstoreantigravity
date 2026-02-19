"use client"

import { CustomerList } from "./CustomerList"
import { CustomerDetailPage } from "./CustomerDetailPage"
import type { AdminCustomerManagementProps } from "@/types/admin-customer"

const c = {
  primary500: "#013f47",
  earth400: "#75615a",
}
const fonts = { body: "'Open Sans', sans-serif" }

export function AdminCustomerManagement({
  customers,
  customerDetail,
  filters,
  totalCount,
  isLoading,
  isDetailLoading,
  onChangeFilters,
  onViewCustomer,
  onViewOrder,
  onAddNote,
  onBackToList,
}: AdminCustomerManagementProps) {
  // Loading state while detail is being fetched
  if (isDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading customer…
          </p>
        </div>
      </div>
    )
  }

  if (customerDetail) {
    return (
      <CustomerDetailPage
        customer={customerDetail}
        onBack={onBackToList}
        onViewOrder={onViewOrder}
        onAddNote={onAddNote}
      />
    )
  }

  // Loading state for list
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading customers…
          </p>
        </div>
      </div>
    )
  }

  return (
    <CustomerList
      customers={customers}
      filters={filters}
      totalCount={totalCount}
      onChangeFilters={onChangeFilters}
      onViewCustomer={onViewCustomer}
    />
  )
}
