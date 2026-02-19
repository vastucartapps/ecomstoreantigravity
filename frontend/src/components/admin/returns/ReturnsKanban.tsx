"use client"

import { useState } from "react"
import { Search, GripVertical, Package, ChevronDown } from "lucide-react"
import type { ReturnCard, ReturnStatus, ReturnsKanbanProps } from "@/types/admin-return"

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
  shadowHover: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

const columnConfig: Record<
  Extract<ReturnStatus, "pending" | "under_review" | "approved" | "refunded">,
  { title: string; color: string; bgColor: string }
> = {
  pending: {
    title: "Pending",
    color: c.warning,
    bgColor: c.warningLight,
  },
  under_review: {
    title: "Under Review",
    color: c.primary200,
    bgColor: c.primary50,
  },
  approved: {
    title: "Approved",
    color: c.success,
    bgColor: c.successLight,
  },
  refunded: {
    title: "Refunded",
    color: c.primary500,
    bgColor: c.primary50,
  },
}

const KANBAN_STATUSES = ["pending", "under_review", "approved", "refunded"] as const
type KanbanStatus = (typeof KANBAN_STATUSES)[number]

const reasonLabels: Record<string, string> = {
  damaged_in_transit: "Damaged in Transit",
  wrong_item: "Wrong Item",
  not_as_described: "Not as Described",
  defective: "Defective",
  size_issue: "Size/Fit Issue",
  changed_mind: "Changed Mind",
  other: "Other",
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "INR" ? "₹" : "$"
  const formatted = amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

function getDaysOpenBadge(daysOpen: number) {
  if (daysOpen < 3) {
    return { color: c.success, bgColor: c.successLight, label: `${daysOpen}d` }
  } else if (daysOpen <= 7) {
    return { color: c.warning, bgColor: c.warningLight, label: `${daysOpen}d` }
  } else {
    return { color: c.error, bgColor: c.errorLight, label: `${daysOpen}d` }
  }
}

function ReturnCardComponent({
  returnData,
  columnColor,
  onViewReturn,
  onMoveReturn,
}: {
  returnData: ReturnCard
  columnColor: string
  onViewReturn?: (id: string) => void
  onMoveReturn?: (id: string, status: ReturnStatus) => void
}) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const daysBadge = getDaysOpenBadge(returnData.daysOpen)

  const availableStatuses = KANBAN_STATUSES.filter(
    (s) => s !== returnData.status
  )

  return (
    <div
      onClick={() => onViewReturn?.(returnData.id)}
      style={{
        background: c.card,
        borderLeft: `4px solid ${columnColor}`,
        borderRadius: "0.5rem",
        boxShadow: c.shadow,
        cursor: "pointer",
        transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = c.shadowHover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = c.shadow)}
      className="p-4 mb-3"
    >
      {/* Header: order # + move button */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={16} style={{ color: c.earth300 }} />
          <span style={{ fontFamily: fonts.mono, fontSize: "0.75rem", color: c.earth500 }}>
            #{returnData.orderNumber}
          </span>
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMoveMenu(!showMoveMenu)
            }}
            style={{
              background: c.subtle,
              color: c.earth600,
              fontFamily: fonts.body,
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            Move <ChevronDown size={12} />
          </button>
          {showMoveMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "0.25rem",
                background: c.card,
                border: `1px solid ${c.earth300}`,
                borderRadius: "0.375rem",
                boxShadow: c.shadowHover,
                minWidth: "140px",
                zIndex: 10,
              }}
            >
              {availableStatuses.map((status) => (
                <button
                  key={status}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMoveReturn?.(returnData.id, status)
                    setShowMoveMenu(false)
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.5rem 0.75rem",
                    fontFamily: fonts.body,
                    fontSize: "0.875rem",
                    color: c.earth700,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = c.primary50)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {columnConfig[status].title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="flex gap-3 mb-3">
        {returnData.productImageUrl ? (
          <img
            src={returnData.productImageUrl}
            alt={returnData.productName}
            style={{
              width: "48px",
              height: "48px",
              objectFit: "cover",
              borderRadius: "0.375rem",
              border: `1px solid ${c.earth300}`,
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "0.375rem",
              border: `1px solid ${c.earth300}`,
              background: c.primary50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={20} style={{ color: c.earth300 }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: c.earth700,
              marginBottom: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {returnData.productName}
          </div>
          {returnData.variantLabel && (
            <div style={{ fontFamily: fonts.body, fontSize: "0.75rem", color: c.earth500 }}>
              {returnData.variantLabel}
            </div>
          )}
        </div>
      </div>

      {/* Customer name */}
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: "0.875rem",
          color: c.earth600,
          marginBottom: "0.5rem",
        }}
      >
        {returnData.customerName}
      </div>

      {/* Reason badge */}
      <div
        style={{
          display: "inline-block",
          background: c.secondary50,
          color: c.secondary500,
          fontFamily: fonts.body,
          fontSize: "0.75rem",
          padding: "0.25rem 0.5rem",
          borderRadius: "0.25rem",
          marginBottom: "0.75rem",
        }}
      >
        {reasonLabels[returnData.reason] || returnData.reason}
      </div>

      {/* Footer: refund amount + days open */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: `1px solid ${c.earth300}` }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: "0.875rem",
            fontWeight: 600,
            color: c.primary500,
          }}
        >
          {formatCurrency(returnData.refundAmount, returnData.currency)}
        </div>
        <div
          style={{
            background: daysBadge.bgColor,
            color: daysBadge.color,
            fontFamily: fonts.mono,
            fontSize: "0.75rem",
            fontWeight: 600,
            padding: "0.25rem 0.5rem",
            borderRadius: "0.25rem",
          }}
        >
          {daysBadge.label}
        </div>
      </div>
    </div>
  )
}

export function ReturnsKanban({
  returns,
  isLoading,
  onViewReturn,
  onMoveReturn,
  onSearch,
}: ReturnsKanbanProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReturns = returns.filter((ret) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ret.orderNumber.toLowerCase().includes(query) ||
      ret.customerName.toLowerCase().includes(query) ||
      ret.customerEmail.toLowerCase().includes(query)
    )
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const returnsByStatus = filteredReturns.reduce(
    (acc, ret) => {
      const key = ret.status as KanbanStatus
      if (!acc[key]) acc[key] = []
      acc[key].push(ret)
      return acc
    },
    {} as Record<KanbanStatus, ReturnCard[]>
  )

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.875rem",
                fontWeight: 600,
                color: c.earth700,
              }}
            >
              Returns & Refunds
            </h1>
            <p style={{ fontSize: "0.875rem", color: c.earth500, marginTop: "0.25rem" }}>
              {isLoading ? "Loading…" : `${filteredReturns.length} total return${filteredReturns.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative" style={{ maxWidth: "480px" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: c.earth400,
            }}
          />
          <input
            type="text"
            placeholder="Search by order # or customer name..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: "2.5rem",
              paddingRight: "0.75rem",
              paddingTop: "0.625rem",
              paddingBottom: "0.625rem",
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              border: `1px solid ${c.earth300}`,
              borderRadius: "0.5rem",
              background: c.card,
              color: c.earth700,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div
        className="overflow-x-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(280px, 1fr))",
          gap: "1rem",
        }}
      >
        {KANBAN_STATUSES.map((status) => {
          const config = columnConfig[status]
          const columnReturns = returnsByStatus[status] || []

          return (
            <div key={status}>
              {/* Column header */}
              <div
                style={{
                  background: config.bgColor,
                  borderTop: `3px solid ${config.color}`,
                  borderRadius: "0.5rem 0.5rem 0 0",
                  padding: "0.75rem 1rem",
                  marginBottom: "0.5rem",
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    style={{
                      fontFamily: fonts.heading,
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: c.earth700,
                    }}
                  >
                    {config.title}
                  </h3>
                  <span
                    style={{
                      background: c.card,
                      color: config.color,
                      fontFamily: fonts.mono,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                    }}
                  >
                    {columnReturns.length}
                  </span>
                </div>
              </div>

              {/* Cards list */}
              <div
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                  paddingRight: "0.25rem",
                }}
              >
                {isLoading ? (
                  <div
                    style={{
                      background: c.card,
                      borderRadius: "0.5rem",
                      padding: "2rem 1rem",
                      textAlign: "center",
                      border: `1px dashed ${c.earth300}`,
                    }}
                  >
                    <div
                      className="animate-spin h-6 w-6 border-2 border-t-transparent rounded-full mx-auto"
                      style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
                    />
                  </div>
                ) : columnReturns.length === 0 ? (
                  <div
                    style={{
                      background: c.card,
                      borderRadius: "0.5rem",
                      padding: "2rem 1rem",
                      textAlign: "center",
                      border: `1px dashed ${c.earth300}`,
                    }}
                  >
                    <Package size={32} style={{ color: c.earth300, margin: "0 auto 0.5rem" }} />
                    <p style={{ color: c.earth400, fontSize: "0.875rem" }}>No returns</p>
                  </div>
                ) : (
                  columnReturns.map((ret) => (
                    <ReturnCardComponent
                      key={ret.id}
                      returnData={ret}
                      columnColor={config.color}
                      onViewReturn={onViewReturn}
                      onMoveReturn={onMoveReturn}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
