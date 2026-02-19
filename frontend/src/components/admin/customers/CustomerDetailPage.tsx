"use client"

import { useState } from "react"
import {
  ArrowLeft, Mail, Phone, Calendar, ShoppingBag,
  TrendingUp, Award, MapPin, Star, User,
} from "lucide-react"
import type { CustomerDetailPageProps, CustomerSegment } from "@/types/admin-customer"

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

export function CustomerDetailPage({ customer, onBack, onViewOrder, onAddNote }: CustomerDetailPageProps) {
  const [noteText, setNoteText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "INR" ? "₹" : "$"
    return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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

  const getSegmentLabel = (segment: CustomerSegment) => {
    switch (segment) {
      case "new": return "New"
      case "repeat": return "Repeat"
      case "inactive": return "Inactive"
      case "high_value": return "High Value"
    }
  }

  const getOrderStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: c.warningLight, text: c.warning }
      case "confirmed":
      case "processing":
        return { bg: c.primary100, text: c.primary500 }
      case "shipped":
      case "delivered":
        return { bg: c.successLight, text: c.success }
      case "cancelled":
        return { bg: c.errorLight, text: c.error }
      default:
        return { bg: c.subtle, text: c.earth600 }
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim() || !onAddNote) return
    setIsAddingNote(true)
    try {
      await onAddNote(customer.id, noteText.trim())
      setNoteText("")
    } finally {
      setIsAddingNote(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? c.warning : "none"}
            stroke={star <= rating ? c.warning : c.earth300}
          />
        ))}
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          background: "transparent",
          border: `1px solid ${c.earth300}`,
          borderRadius: "8px",
          color: c.earth700,
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "24px",
          transition: "all 200ms",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = c.subtle
          e.currentTarget.style.borderColor = c.primary400
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "transparent"
          e.currentTarget.style.borderColor = c.earth300
        }}
      >
        <ArrowLeft size={16} />
        Back to Customers
      </button>

      <h1 style={{ fontFamily: fonts.heading, fontSize: "32px", fontWeight: 600, color: c.earth700, margin: "0 0 32px 0" }}>
        {customer.name}
      </h1>

      {/* Profile Header Card */}
      <div
        style={{
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: c.shadow,
          borderTop: "4px solid transparent",
        }}
      >
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <img
            src={
              customer.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=013f47&color=fff&size=160`
            }
            alt={customer.name}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <div style={{ flex: 1, minWidth: "300px" }}>
            <h2 style={{ fontFamily: fonts.heading, fontSize: "24px", fontWeight: 600, color: c.earth700, margin: "0 0 16px 0" }}>
              {customer.name}
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: c.earth600, fontSize: "15px" }}>
                <Mail size={18} style={{ color: c.earth400 }} />
                {customer.email}
                {customer.emailVerified && (
                  <span
                    style={{
                      background: c.successLight,
                      color: c.success,
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Verified
                  </span>
                )}
              </div>
              {customer.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: c.earth600, fontSize: "15px" }}>
                  <Phone size={18} style={{ color: c.earth400 }} />
                  {customer.phone}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: c.earth600, fontSize: "15px" }}>
                <Calendar size={18} style={{ color: c.earth400 }} />
                Member since {formatDate(customer.joinedAt)}
              </div>
              {customer.lastOrderAt && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: c.earth600, fontSize: "15px" }}>
                  <ShoppingBag size={18} style={{ color: c.earth400 }} />
                  Last order on {formatDate(customer.lastOrderAt)}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
              {customer.segments.map(segment => {
                const style = getSegmentStyle(segment)
                return (
                  <span
                    key={segment}
                    style={{
                      background: style.bg,
                      color: style.text,
                      padding: "6px 14px",
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {getSegmentLabel(segment)}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <ShoppingBag size={24} style={{ color: c.primary500 }} />
            <span style={{ color: c.earth500, fontSize: "14px", fontWeight: 600 }}>Total Orders</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: c.earth700 }}>
            {customer.totalOrders}
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <TrendingUp size={24} style={{ color: c.secondary500 }} />
            <span style={{ color: c.earth500, fontSize: "14px", fontWeight: 600 }}>Lifetime Value</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: c.earth700 }}>
            {formatCurrency(customer.lifetimeValue, customer.currency)}
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <TrendingUp size={24} style={{ color: c.success }} />
            <span style={{ color: c.earth500, fontSize: "14px", fontWeight: 600 }}>Avg Order Value</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: c.earth700 }}>
            {formatCurrency(customer.averageOrderValue, customer.currency)}
          </div>
        </div>

        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <Award size={24} style={{ color: c.warning }} />
            <span style={{ color: c.earth500, fontSize: "14px", fontWeight: 600 }}>Loyalty Points</span>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: c.earth700 }}>
            {customer.loyaltyPoints.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div
        style={{
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px",
          marginBottom: "24px",
          boxShadow: c.shadow,
          borderTop: "4px solid transparent",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "24px", borderBottom: `1px solid ${c.subtle}` }}>
          <h3 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: c.earth700, margin: 0 }}>
            Recent Orders
          </h3>
        </div>
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: c.subtle }}>
                {["Order #", "Items", "Total", "Status", "Date"].map(col => (
                  <th
                    key={col}
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
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customer.recentOrders.slice(0, 5).map(order => {
                const statusStyle = getOrderStatusStyle(order.status)
                return (
                  <tr
                    key={order.id}
                    style={{
                      borderTop: `1px solid ${c.subtle}`,
                      cursor: onViewOrder ? "pointer" : "default",
                      transition: "background 200ms",
                    }}
                    onClick={() => onViewOrder?.(order.id)}
                    onMouseEnter={e => onViewOrder && (e.currentTarget.style.background = c.bg)}
                    onMouseLeave={e => onViewOrder && (e.currentTarget.style.background = c.card)}
                  >
                    <td style={{ padding: "16px" }}>
                      <span style={{ fontFamily: fonts.mono, fontSize: "14px", color: c.primary500, fontWeight: 600 }}>
                        {order.orderNumber}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: c.earth600, fontSize: "14px" }}>
                      {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </td>
                    <td style={{ padding: "16px", color: c.earth700, fontSize: "14px", fontWeight: 600 }}>
                      {formatCurrency(order.total, customer.currency)}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          padding: "4px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: c.earth600, fontSize: "14px" }}>
                      {formatDate(order.date)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {customer.recentOrders.length === 0 && (
          <div style={{ padding: "48px", textAlign: "center", color: c.earth500, fontSize: "15px" }}>
            No orders yet.
          </div>
        )}
      </div>

      {/* Addresses Section */}
      {customer.addresses.length > 0 && (
        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            marginBottom: "24px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <h3 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: c.earth700, margin: "0 0 20px 0" }}>
            Addresses
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {customer.addresses.map(address => (
              <div
                key={address.id}
                style={{
                  border: `1px solid ${c.earth300}`,
                  borderRadius: "8px",
                  padding: "16px",
                  background: c.bg,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <MapPin size={16} style={{ color: c.primary500 }} />
                  <span
                    style={{
                      background: c.primary100,
                      color: c.primary500,
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {address.label}
                  </span>
                  {address.isDefault && (
                    <span
                      style={{
                        background: c.secondary50,
                        color: c.secondary500,
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Default
                    </span>
                  )}
                </div>
                <div style={{ color: c.earth600, fontSize: "14px", lineHeight: 1.6 }}>
                  {address.street}<br />
                  {address.city}, {address.state} {address.pincode}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {customer.reviews.length > 0 && (
        <div
          style={{
            background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
            borderRadius: "12px",
            marginBottom: "24px",
            padding: "24px",
            boxShadow: c.shadow,
            borderTop: "4px solid transparent",
          }}
        >
          <h3 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: c.earth700, margin: "0 0 20px 0" }}>
            Reviews
          </h3>
          <div style={{ display: "grid", gap: "16px" }}>
            {customer.reviews.map(review => (
              <div
                key={review.id}
                style={{
                  border: `1px solid ${c.earth300}`,
                  borderRadius: "8px",
                  padding: "16px",
                  background: c.bg,
                }}
              >
                <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                  <img
                    src={review.productImageUrl}
                    alt={review.productName}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: c.earth700, fontSize: "15px", marginBottom: "4px" }}>
                      {review.productName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {renderStars(review.rating)}
                      <span style={{ color: c.earth500, fontSize: "13px" }}>
                        {formatDate(review.date)}
                      </span>
                    </div>
                  </div>
                </div>
                <p style={{ color: c.earth600, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  {review.excerpt}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes Section */}
      <div
        style={{
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px",
          padding: "24px",
          boxShadow: c.shadow,
          borderTop: "4px solid transparent",
        }}
      >
        <h3 style={{ fontFamily: fonts.heading, fontSize: "20px", fontWeight: 600, color: c.earth700, margin: "0 0 20px 0" }}>
          Admin Notes
        </h3>

        {customer.notes.length > 0 && (
          <div style={{ display: "grid", gap: "12px", marginBottom: "20px" }}>
            {customer.notes.map(note => (
              <div
                key={note.id}
                style={{
                  border: `1px solid ${c.earth300}`,
                  borderRadius: "8px",
                  padding: "12px",
                  background: c.bg,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <User size={14} style={{ color: c.earth400 }} />
                  <span
                    style={{
                      background: c.primary100,
                      color: c.primary500,
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {note.author}
                  </span>
                  <span style={{ color: c.earth500, fontSize: "12px" }}>
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p style={{ color: c.earth600, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                  {note.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Add a note about this customer..."
            style={{
              width: "100%",
              minHeight: "80px",
              padding: "12px",
              border: `1px solid ${c.earth300}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: fonts.body,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={e => (e.target.style.borderColor = c.primary400)}
            onBlur={e => (e.target.style.borderColor = c.earth300)}
          />
          <button
            onClick={handleAddNote}
            disabled={!noteText.trim() || isAddingNote}
            style={{
              alignSelf: "flex-end",
              padding: "10px 20px",
              background: noteText.trim() && !isAddingNote ? c.primary500 : c.earth300,
              color: c.card,
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: noteText.trim() && !isAddingNote ? "pointer" : "not-allowed",
              transition: "all 200ms",
            }}
            onMouseEnter={e => noteText.trim() && !isAddingNote && (e.currentTarget.style.background = c.primary400)}
            onMouseLeave={e => noteText.trim() && !isAddingNote && (e.currentTarget.style.background = c.primary500)}
          >
            {isAddingNote ? "Saving…" : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  )
}
