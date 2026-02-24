"use client"

import { useMemo } from "react"
import { Search, ChevronUp, ChevronDown, Eye } from "lucide-react"
import type { CustomerListProps, CustomerFilters, CustomerSegment } from "@/types/admin-customer"

const c = {
  primary500: "#013f47", primary400: "#2a7a72", primary200: "#71c1ae",
  primary100: "#c5e8e2", primary50: "#e8f5f3",
  secondary500: "#c85103", secondary300: "#fd8630", secondary50: "#fff5ed",
  bg: "#fffbf5", card: "#ffffff", subtle: "#f5dfbb",
  earth300: "#a39585", earth400: "#75615a", earth500: "#71685b", earth600: "#5a4f47", earth700: "#433b35",
  success: "#10B981", successLight: "#D1FAE5",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  error: "#EF4444", errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = { heading: "'Lora', serif", body: "'Open Sans', sans-serif", mono: "'IBM Plex Mono', monospace" }

// MUST be module-level — not inside CustomerList — otherwise React creates a new component
// type on every render, unmounting/remounting the element and destroying any interaction state.
function SortIcon({ field, sortField, sortDirection }: {
  field: string
  sortField: CustomerFilters["sortField"]
  sortDirection: CustomerFilters["sortDirection"]
}) {
  if (sortField !== field) return null
  return sortDirection === "asc" ? (
    <ChevronUp size={16} style={{ color: c.primary500 }} />
  ) : (
    <ChevronDown size={16} style={{ color: c.primary500 }} />
  )
}

export function CustomerList({ customers, filters, totalCount, isLoading, onChangeFilters, onViewCustomer }: CustomerListProps) {

  const segmentCounts = useMemo(() => {
    const counts = {
      all: totalCount,
      new: 0,
      repeat: 0,
      inactive: 0,
      high_value: 0,
    }
    customers.forEach(customer => {
      customer.segments.forEach(segment => {
        counts[segment]++
      })
    })
    return counts
  }, [customers, totalCount])

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...customers]

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        row =>
          row.name.toLowerCase().includes(searchLower) ||
          row.email.toLowerCase().includes(searchLower) ||
          (row.phone && row.phone.toLowerCase().includes(searchLower))
      )
    }

    // Filter by segment
    if (filters.segment !== "all") {
      result = result.filter(row => row.segments.includes(filters.segment as CustomerSegment))
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number, bVal: string | number
      switch (filters.sortField) {
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case "totalOrders":
          aVal = a.totalOrders
          bVal = b.totalOrders
          break
        case "lifetimeValue":
          aVal = a.lifetimeValue
          bVal = b.lifetimeValue
          break
        case "joinedAt":
          aVal = new Date(a.joinedAt).getTime()
          bVal = new Date(b.joinedAt).getTime()
          break
        default:
          return 0
      }

      if (aVal < bVal) return filters.sortDirection === "asc" ? -1 : 1
      if (aVal > bVal) return filters.sortDirection === "asc" ? 1 : -1
      return 0
    })

    return result
  }, [customers, filters])

  const handleSort = (field: CustomerFilters["sortField"]) => {
    if (filters.sortField === field) {
      onChangeFilters?.({
        sortDirection: filters.sortDirection === "asc" ? "desc" : "asc",
      })
    } else {
      onChangeFilters?.({
        sortField: field,
        sortDirection: "desc",
      })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "INR" ? "₹" : "$"
    return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const getSegmentStyle = (segment: CustomerSegment) => {
    switch (segment) {
      case "new":
        return { bg: c.primary100, text: c.primary500 }
      case "repeat":
        return { bg: c.successLight, text: c.success }
      case "inactive":
        return { bg: c.warningLight, text: c.warning }
      case "high_value":
        return { bg: c.secondary50, text: c.secondary500 }
    }
  }

  const getSegmentLabel = (segment: CustomerSegment | "all") => {
    switch (segment) {
      case "all": return "All"
      case "new": return "New"
      case "repeat": return "Repeat"
      case "inactive": return "Inactive"
      case "high_value": return "High Value"
    }
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Header */}
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: "32px", fontWeight: 600, color: c.earth700, margin: 0 }}>
          Customers
        </h1>
        <span
          style={{
            background: c.primary100,
            color: c.primary500,
            padding: "4px 12px",
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {filteredAndSortedCustomers.length}
        </span>
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px", position: "relative" }}>
        <Search
          size={20}
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: c.earth400,
          }}
        />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={filters.search}
          onChange={e => onChangeFilters?.({ search: e.target.value })}
          style={{
            width: "100%",
            padding: "12px 16px 12px 48px",
            border: `1px solid ${c.earth300}`,
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: fonts.body,
            outline: "none",
            background: c.card,
            boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = c.primary400)}
          onBlur={e => (e.target.style.borderColor = c.earth300)}
        />
      </div>

      {/* Segment Filter Pills */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(["all", "new", "repeat", "inactive", "high_value"] as const).map(segment => (
          <button
            key={segment}
            onClick={() => onChangeFilters?.({ segment })}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: filters.segment === segment ? "none" : `1px solid ${c.earth300}`,
              background: filters.segment === segment ? c.primary500 : c.card,
              color: filters.segment === segment ? c.card : c.earth600,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 200ms",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {getSegmentLabel(segment)}
            <span
              style={{
                background: filters.segment === segment ? "rgba(255,255,255,0.2)" : c.earth300,
                color: filters.segment === segment ? c.card : c.earth700,
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {segmentCounts[segment]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        style={{
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px",
          boxShadow: c.shadow,
          overflow: "hidden",
          borderTop: "4px solid transparent",
        }}
      >
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.subtle }}>
                <th
                  onClick={() => handleSort("name")}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Customer
                    <SortIcon field="name" sortField={filters.sortField} sortDirection={filters.sortDirection} />
                  </div>
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Phone
                </th>
                <th
                  onClick={() => handleSort("totalOrders")}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Orders
                    <SortIcon field="totalOrders" sortField={filters.sortField} sortDirection={filters.sortDirection} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("lifetimeValue")}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Lifetime Value
                    <SortIcon field="lifetimeValue" sortField={filters.sortField} sortDirection={filters.sortDirection} />
                  </div>
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Segments
                </th>
                <th
                  onClick={() => handleSort("joinedAt")}
                  style={{
                    padding: "16px",
                    textAlign: "left",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    Joined
                    <SortIcon field="joinedAt" sortField={filters.sortField} sortDirection={filters.sortDirection} />
                  </div>
                </th>
                <th
                  style={{
                    padding: "16px",
                    textAlign: "right",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: c.earth700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && customers.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`} style={{ borderTop: `1px solid ${c.subtle}` }}>
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div className="animate-pulse" style={{ width: 48, height: 48, borderRadius: "50%", background: c.subtle, flexShrink: 0 }} />
                          <div>
                            <div className="animate-pulse" style={{ height: 15, width: 130, background: c.subtle, borderRadius: 4, marginBottom: 4 }} />
                            <div className="animate-pulse" style={{ height: 13, width: 170, background: c.subtle, borderRadius: 4 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="animate-pulse" style={{ height: 14, width: 90, background: c.subtle, borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="animate-pulse" style={{ height: 14, width: 30, background: c.subtle, borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="animate-pulse" style={{ height: 14, width: 80, background: c.subtle, borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="animate-pulse" style={{ height: 24, width: 60, background: c.subtle, borderRadius: 12 }} />
                      </td>
                      <td style={{ padding: "16px" }}>
                        <div className="animate-pulse" style={{ height: 14, width: 80, background: c.subtle, borderRadius: 4 }} />
                      </td>
                      <td style={{ padding: "16px", textAlign: "right" }}>
                        <div className="animate-pulse" style={{ height: 36, width: 70, background: c.subtle, borderRadius: 6, display: "inline-block" }} />
                      </td>
                    </tr>
                  ))
                : filteredAndSortedCustomers.map(customer => (
                <tr
                  key={customer.id}
                  onClick={() => onViewCustomer?.(customer.id)}
                  style={{
                    borderTop: `1px solid ${c.subtle}`,
                    cursor: "pointer",
                    transition: "background 200ms",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.bg)}
                  onMouseLeave={e => (e.currentTarget.style.background = c.card)}
                >
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={
                          customer.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=013f47&color=fff`
                        }
                        alt={customer.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: c.earth700, fontSize: "15px" }}>
                          {customer.name}
                        </div>
                        <div style={{ color: c.earth500, fontSize: "13px" }}>
                          {customer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px", color: c.earth600, fontSize: "14px" }}>
                    {customer.phone || "—"}
                  </td>
                  <td style={{ padding: "16px", color: c.earth700, fontSize: "14px", fontWeight: 600 }}>
                    {customer.totalOrders}
                  </td>
                  <td style={{ padding: "16px", color: c.earth700, fontSize: "14px", fontWeight: 600 }}>
                    {formatCurrency(customer.lifetimeValue, customer.currency)}
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {customer.segments.map(segment => {
                        const style = getSegmentStyle(segment)
                        return (
                          <span
                            key={segment}
                            style={{
                              background: style.bg,
                              color: style.text,
                              padding: "4px 10px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {getSegmentLabel(segment)}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td style={{ padding: "16px", color: c.earth600, fontSize: "14px" }}>
                    {formatDate(customer.joinedAt)}
                  </td>
                  <td style={{ padding: "16px", textAlign: "right" }}>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onViewCustomer?.(customer.id)
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        background: c.primary500,
                        color: c.card,
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 200ms",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = c.primary400)}
                      onMouseLeave={e => (e.currentTarget.style.background = c.primary500)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedCustomers.length === 0 && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: c.earth500,
              fontSize: "15px",
            }}
          >
            No customers found matching your filters.
          </div>
        )}
      </div>
    </div>
  )
}
