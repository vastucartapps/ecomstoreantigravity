"use client"

import { useState } from "react"
import type { AdminOrderManagementProps } from "@/types/admin-order"
import { OrdersTable } from "./OrdersTable"
import { OrderDetailPage } from "./OrderDetailPage"

const c = {
  primary500: "#013f47",
  earth400: "#75615a",
}

const fonts = { body: "'Open Sans', sans-serif" }

export function AdminOrderManagement(props: AdminOrderManagementProps) {
  const [view, setView] = useState<"list" | "detail">("list")

  const handleViewOrder = (orderId: string) => {
    setView("detail")
    props.onViewOrder?.(orderId)
  }

  const handleBack = () => {
    setView("list")
    props.onBackToList?.()
  }

  // Loading state while detail is being fetched
  if (view === "detail" && props.isDetailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading order…
          </p>
        </div>
      </div>
    )
  }

  if (view === "detail" && props.orderDetail) {
    return (
      <OrderDetailPage
        order={props.orderDetail}
        onBack={handleBack}
        onUpdateStatus={props.onUpdateStatus}
        onAddNote={props.onAddNote}
        onDownloadInvoice={props.onDownloadInvoice}
        onEmailCustomer={props.onEmailCustomer}
      />
    )
  }

  return (
    <>
      {/* Loading overlay */}
      {props.isLoading && (
        <div className="flex items-center justify-center h-16 mb-2">
          <div
            className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <span className="ml-2 text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading orders…
          </span>
        </div>
      )}
      <OrdersTable
        orders={props.orders}
        filters={props.filters}
        pagination={props.pagination}
        onChangeFilters={props.onChangeFilters}
        onChangePage={props.onChangePage}
        onChangePerPage={props.onChangePerPage}
        onViewOrder={handleViewOrder}
        onDownloadInvoice={props.onDownloadInvoice}
      />
    </>
  )
}
