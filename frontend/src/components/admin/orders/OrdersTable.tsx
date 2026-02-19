"use client"

import { useState, useMemo } from "react"
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Download,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type {
  OrdersTableProps,
  OrderRow,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DatePreset,
  OrderSortField,
  SortDirection,
} from "@/types/admin-order"

// Brand constants
const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

// Status configuration
const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  processing: { label: "Processing", bg: c.warningLight, text: c.warning },
  accepted: { label: "Accepted", bg: c.primary50, text: c.primary500 },
  shipped: { label: "Shipped", bg: c.primary100, text: c.primary500 },
  in_transit: { label: "In Transit", bg: c.primary200, text: c.primary500 },
  out_for_delivery: { label: "Out for Delivery", bg: c.secondary50, text: c.secondary500 },
  delivered: { label: "Delivered", bg: c.successLight, text: c.success },
  cancelled: { label: "Cancelled", bg: c.errorLight, text: c.error },
  returned: { label: "Returned", bg: c.errorLight, text: c.error },
}

// Payment method icons
const paymentMethodConfig: Record<
  PaymentMethod,
  { label: string; Icon: React.FC<{ size?: number; color?: string }> }
> = {
  razorpay: { label: "Razorpay", Icon: CreditCard },
  stripe: { label: "Stripe", Icon: CreditCard },
  cod: { label: "Cash on Delivery", Icon: Wallet },
  upi: { label: "UPI", Icon: Smartphone },
  netbanking: { label: "Net Banking", Icon: Building2 },
  wallet: { label: "Wallet", Icon: Wallet },
}

// Payment status colors
const paymentStatusConfig: Record<PaymentStatus, { dot: string; label: string }> = {
  paid: { dot: c.success, label: "Paid" },
  pending: { dot: c.warning, label: "Pending" },
  failed: { dot: c.error, label: "Failed" },
  refunded: { dot: c.earth400, label: "Refunded" },
}

// Date presets
const datePresets: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "30days", label: "Last 30 Days" },
  { value: "custom", label: "Custom" },
]

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const displayHours = date.getHours() % 12 || 12
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const ampm = date.getHours() >= 12 ? "PM" : "AM"
  return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`
}

function formatCurrency(amount: number, currency: "INR" | "USD"): string {
  const symbol = currency === "INR" ? "₹" : "$"
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

export function OrdersTable({
  orders,
  filters,
  pagination,
  onChangeFilters,
  onChangePage,
  onChangePerPage,
  onViewOrder,
  onDownloadInvoice,
}: OrdersTableProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)

  // Calculate counts per status
  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus | "all", number> = {
      all: pagination.totalItems,
      processing: 0,
      accepted: 0,
      shipped: 0,
      in_transit: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    }
    orders.forEach((order) => {
      counts[order.status]++
    })
    return counts
  }, [orders, pagination.totalItems])

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onChangeFilters?.({ search: value })
  }

  const handleStatusChange = (status: OrderStatus | "all") => {
    onChangeFilters?.({ status })
  }

  const handleDatePresetChange = (preset: DatePreset) => {
    const today = new Date()
    let dateFrom = ""
    let dateTo = ""

    if (preset === "today") {
      dateFrom = today.toISOString().split("T")[0]
      dateTo = today.toISOString().split("T")[0]
    } else if (preset === "7days") {
      const ago = new Date(today)
      ago.setDate(today.getDate() - 7)
      dateFrom = ago.toISOString().split("T")[0]
      dateTo = today.toISOString().split("T")[0]
    } else if (preset === "30days") {
      const ago = new Date(today)
      ago.setDate(today.getDate() - 30)
      dateFrom = ago.toISOString().split("T")[0]
      dateTo = today.toISOString().split("T")[0]
    }

    onChangeFilters?.({ datePreset: preset, dateFrom, dateTo })
  }

  const handleSortChange = (field: OrderSortField) => {
    const newDirection: SortDirection =
      filters.sortField === field && filters.sortDirection === "asc" ? "desc" : "asc"
    onChangeFilters?.({ sortField: field, sortDirection: newDirection })
  }

  const renderSortIndicator = (field: OrderSortField) => {
    if (filters.sortField !== field) {
      return <ChevronsUpDown size={14} style={{ color: c.earth300 }} />
    }
    return filters.sortDirection === "asc" ? (
      <ChevronUp size={14} style={{ color: c.primary500 }} />
    ) : (
      <ChevronDown size={14} style={{ color: c.primary500 }} />
    )
  }

  const startItem = (pagination.page - 1) * pagination.perPage + 1
  const endItem = Math.min(pagination.page * pagination.perPage, pagination.totalItems)

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxPages = 7

    if (pagination.totalPages <= maxPages) {
      for (let i = 1; i <= pagination.totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let startPage = Math.max(2, pagination.page - 1)
      let endPage = Math.min(pagination.totalPages - 1, pagination.page + 1)

      if (pagination.page <= 3) endPage = 5
      else if (pagination.page >= pagination.totalPages - 2) startPage = pagination.totalPages - 4

      if (startPage > 2) pages.push("...")
      for (let i = startPage; i <= endPage; i++) pages.push(i)
      if (endPage < pagination.totalPages - 1) pages.push("...")
      pages.push(pagination.totalPages)
    }
    return pages
  }, [pagination.page, pagination.totalPages])

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "32px",
            fontWeight: "600",
            color: c.earth700,
            marginBottom: "8px",
          }}
        >
          Orders
        </h1>
        <p style={{ fontSize: "14px", color: c.earth400 }}>
          {pagination.totalItems.toLocaleString()} total orders
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", maxWidth: "400px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: c.earth400,
            }}
          />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by order # or customer..."
            style={{
              width: "100%",
              paddingLeft: "40px",
              paddingRight: "12px",
              paddingTop: "10px",
              paddingBottom: "10px",
              fontSize: "14px",
              border: `1px solid ${c.earth300}`,
              borderRadius: "6px",
              backgroundColor: c.card,
              color: c.earth700,
              fontFamily: fonts.body,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Status Filter Pills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => handleStatusChange("all")}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "20px",
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
            backgroundColor: filters.status === "all" ? c.primary500 : c.card,
            color: filters.status === "all" ? "#ffffff" : c.earth600,
            transition: "all 0.2s",
          }}
        >
          All ({pagination.totalItems})
        </button>
        {(Object.keys(statusConfig) as OrderStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              borderRadius: "20px",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              backgroundColor: filters.status === status ? c.primary500 : c.card,
              color: filters.status === status ? "#ffffff" : c.earth600,
              transition: "all 0.2s",
            }}
          >
            {statusConfig[status].label} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleDatePresetChange(preset.value)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "6px",
                border: `1px solid ${c.earth300}`,
                cursor: "pointer",
                backgroundColor: filters.datePreset === preset.value ? c.primary50 : c.card,
                color: filters.datePreset === preset.value ? c.primary500 : c.earth600,
                transition: "all 0.2s",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {filters.datePreset === "custom" && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "16px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: c.earth600,
                  marginBottom: "4px",
                }}
              >
                From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => onChangeFilters?.({ dateFrom: e.target.value })}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: `1px solid ${c.earth300}`,
                  borderRadius: "6px",
                  backgroundColor: c.card,
                  color: c.earth700,
                  fontFamily: fonts.body,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: c.earth600,
                  marginBottom: "4px",
                }}
              >
                To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => onChangeFilters?.({ dateTo: e.target.value })}
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  border: `1px solid ${c.earth300}`,
                  borderRadius: "6px",
                  backgroundColor: c.card,
                  color: c.earth700,
                  fontFamily: fonts.body,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div
        style={{
          backgroundColor: c.card,
          borderRadius: "8px",
          boxShadow: c.shadow,
          overflow: "hidden",
          borderTop: "3px solid transparent",
          backgroundImage: `linear-gradient(${c.card}, ${c.card}), ${c.gradient}`,
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
        }}
      >
        {orders.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: c.earth400, fontWeight: "500" }}>
              No orders found
            </p>
            <p style={{ fontSize: "14px", color: c.earth300, marginTop: "8px" }}>
              Try adjusting your filters or search
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: c.bg,
                      borderBottom: `1px solid ${c.earth300}`,
                    }}
                  >
                    {/* Order # */}
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Order #
                    </th>
                    {/* Customer (sortable) */}
                    <th
                      onClick={() => handleSortChange("customer")}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Customer
                        {renderSortIndicator("customer")}
                      </div>
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Items
                    </th>
                    {/* Total (sortable) */}
                    <th
                      onClick={() => handleSortChange("total")}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Total
                        {renderSortIndicator("total")}
                      </div>
                    </th>
                    {/* Status (sortable) */}
                    <th
                      onClick={() => handleSortChange("status")}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Status
                        {renderSortIndicator("status")}
                      </div>
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Payment
                    </th>
                    {/* Date (sortable) */}
                    <th
                      onClick={() => handleSortChange("date")}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        cursor: "pointer",
                        userSelect: "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        Date
                        {renderSortIndicator("date")}
                      </div>
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "right",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: c.earth600,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const PaymentIcon = paymentMethodConfig[order.paymentMethod].Icon
                    return (
                      <tr
                        key={order.id}
                        onClick={() => onViewOrder?.(order.id)}
                        style={{
                          borderBottom: `1px solid ${c.earth300}`,
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = c.bg
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent"
                        }}
                      >
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              fontFamily: fonts.mono,
                              fontSize: "14px",
                              color: c.primary500,
                              fontWeight: "500",
                            }}
                          >
                            {order.orderNumber}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: "500",
                                color: c.earth700,
                                marginBottom: "2px",
                              }}
                            >
                              {order.customerName}
                            </div>
                            <div style={{ fontSize: "13px", color: c.earth400 }}>
                              {order.customerEmail}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "28px",
                              height: "28px",
                              padding: "0 8px",
                              backgroundColor: c.primary50,
                              color: c.primary500,
                              fontSize: "13px",
                              fontWeight: "600",
                              borderRadius: "14px",
                            }}
                          >
                            {order.itemCount}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ fontSize: "14px", fontWeight: "600", color: c.earth700 }}>
                            {formatCurrency(order.total, order.currency)}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "4px 12px",
                              fontSize: "13px",
                              fontWeight: "500",
                              borderRadius: "12px",
                              backgroundColor: statusConfig[order.status].bg,
                              color: statusConfig[order.status].text,
                            }}
                          >
                            {statusConfig[order.status].label}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <PaymentIcon size={16} color={c.earth500} />
                            <div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: c.earth700,
                                  marginBottom: "2px",
                                }}
                              >
                                {paymentMethodConfig[order.paymentMethod].label}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <div
                                  style={{
                                    width: "6px",
                                    height: "6px",
                                    borderRadius: "50%",
                                    backgroundColor: paymentStatusConfig[order.paymentStatus].dot,
                                  }}
                                />
                                <span style={{ fontSize: "12px", color: c.earth400 }}>
                                  {paymentStatusConfig[order.paymentStatus].label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <span style={{ fontSize: "14px", color: c.earth600 }}>
                            {formatDate(order.date)}
                          </span>
                        </td>
                        <td style={{ padding: "16px", textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDownloadInvoice?.(order.id)
                            }}
                            title="Download Invoice"
                            style={{
                              padding: "8px",
                              border: `1px solid ${c.earth300}`,
                              borderRadius: "6px",
                              backgroundColor: c.card,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = c.bg
                              e.currentTarget.style.borderColor = c.primary500
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = c.card
                              e.currentTarget.style.borderColor = c.earth300
                            }}
                          >
                            <Download size={16} color={c.earth600} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: `1px solid ${c.earth300}`,
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ fontSize: "14px", color: c.earth600 }}>
                Showing {startItem}–{endItem} of {pagination.totalItems.toLocaleString()} orders
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px", color: c.earth600 }}>Rows per page:</span>
                  <select
                    value={pagination.perPage}
                    onChange={(e) => onChangePerPage?.(Number(e.target.value))}
                    style={{
                      padding: "6px 12px",
                      fontSize: "14px",
                      border: `1px solid ${c.earth300}`,
                      borderRadius: "6px",
                      backgroundColor: c.card,
                      color: c.earth700,
                      fontFamily: fonts.body,
                      cursor: "pointer",
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => onChangePage?.(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    style={{
                      padding: "6px 12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: `1px solid ${c.earth300}`,
                      borderRadius: "6px",
                      backgroundColor: c.card,
                      color: c.earth700,
                      cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                      opacity: pagination.page === 1 ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {pageNumbers.map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        style={{ padding: "6px 12px", fontSize: "14px", color: c.earth400 }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => onChangePage?.(page as number)}
                        style={{
                          minWidth: "36px",
                          padding: "6px 12px",
                          fontSize: "14px",
                          fontWeight: "500",
                          border:
                            pagination.page === page
                              ? `1px solid ${c.primary500}`
                              : `1px solid ${c.earth300}`,
                          borderRadius: "6px",
                          backgroundColor: pagination.page === page ? c.primary50 : c.card,
                          color: pagination.page === page ? c.primary500 : c.earth700,
                          cursor: "pointer",
                        }}
                      >
                        {page}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => onChangePage?.(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    style={{
                      padding: "6px 12px",
                      fontSize: "14px",
                      fontWeight: "500",
                      border: `1px solid ${c.earth300}`,
                      borderRadius: "6px",
                      backgroundColor: c.card,
                      color: c.earth700,
                      cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
                      opacity: pagination.page === pagination.totalPages ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
