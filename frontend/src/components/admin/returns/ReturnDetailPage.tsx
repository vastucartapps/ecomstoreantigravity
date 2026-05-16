"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Package,
  User,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  IndianRupee,
  DollarSign,
  X,
} from "lucide-react"
import type {
  ReturnDetailPageProps,
  ReturnReason,
  ReturnStatus,
  RefundType,
  RefundMethod,
} from "@/types/admin-return"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

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

function getReasonLabel(reason: ReturnReason): string {
  const labels: Record<ReturnReason, string> = {
    defective: "Defective Product",
    wrong_item: "Wrong Item Received",
    not_as_described: "Not as Described",
    changed_mind: "Changed Mind",
    size_issue: "Size Issue",
    damaged_in_transit: "Damaged in Transit",
    other: "Other",
  }
  return labels[reason]
}

function formatCurrency(amount: number, currency: "INR" | "USD"): string {
  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  })
  return formatter.format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function StatusBadge({ status }: { status: ReturnStatus }) {
  const styles: Record<ReturnStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: c.warningLight, text: c.warning, label: "Pending" },
    under_review: { bg: c.primary50, text: c.primary500, label: "Under Review" },
    approved: { bg: c.successLight, text: c.success, label: "Approved" },
    refunded: { bg: c.primary50, text: c.primary500, label: "Refunded" },
    rejected: { bg: c.errorLight, text: c.error, label: "Rejected" },
  }
  const style = styles[status]
  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.text,
        fontFamily: fonts.body,
        fontSize: "0.875rem",
        fontWeight: 600,
        padding: "0.375rem 0.75rem",
        borderRadius: "9999px",
      }}
    >
      {style.label}
    </span>
  )
}

function PhotoLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.9)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          backgroundColor: c.card,
          border: "none",
          borderRadius: "9999px",
          padding: "0.5rem",
          cursor: "pointer",
          boxShadow: c.shadow,
        }}
      >
        <X size={24} color={c.earth700} />
      </button>
      <img
        src={url}
        alt="Enlarged"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          borderRadius: "0.5rem",
          boxShadow: c.shadow,
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

export function ReturnDetailPage({
  returnRequest,
  onBack,
  onApprove,
  onReject,
  onProcessRefund,
  onInitiateExchange,
}: ReturnDetailPageProps) {
  const [adminNotes, setAdminNotes] = useState("")
  const [refundType, setRefundType] = useState<RefundType>("full")
  const [refundAmount, setRefundAmount] = useState(returnRequest.product.price.toString())
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("original_payment")
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isProcessingRefund, setIsProcessingRefund] = useState(false)
  const [isInitiatingExchange, setIsInitiatingExchange] = useState(false)

  const handleApprove = async () => {
    if (!onApprove) return
    setIsApproving(true)
    try {
      await onApprove(returnRequest.id, adminNotes)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return
    setIsRejecting(true)
    try {
      await onReject(returnRequest.id, adminNotes)
    } finally {
      setIsRejecting(false)
    }
  }

  const handleProcessRefund = async () => {
    if (!onProcessRefund) return
    const amount = parseFloat(refundAmount) || returnRequest.product.price
    // Force a confirm because refunds touch real money — an accidental click
    // on the "Process refund" button can't be undone, and Razorpay/Stripe
    // refunds become customer-visible immediately.
    const confirmed = window.confirm(
      `Refund ₹${amount.toLocaleString("en-IN")} via ${refundMethod}? This cannot be undone.`
    )
    if (!confirmed) return
    setIsProcessingRefund(true)
    try {
      await onProcessRefund(returnRequest.id, refundType, amount, refundMethod)
    } finally {
      setIsProcessingRefund(false)
    }
  }

  const handleInitiateExchange = async () => {
    if (!onInitiateExchange) return
    setIsInitiatingExchange(true)
    try {
      await onInitiateExchange(returnRequest.id)
    } finally {
      setIsInitiatingExchange(false)
    }
  }

  const showAdminActions =
    returnRequest.status === "pending" || returnRequest.status === "under_review"
  const showRefundProcessing = returnRequest.status === "approved"
  const showRefundSummary = returnRequest.status === "refunded"

  const CurrencyIcon = returnRequest.product.currency === "INR" ? IndianRupee : DollarSign

  return (
    <div style={{ maxWidth: "1400px" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "transparent",
            border: "none",
            color: c.primary500,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: "0.5rem 0",
            marginBottom: "1rem",
          }}
        >
          <ArrowLeft size={16} />
          Back to Returns Board
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "2rem",
              fontWeight: 600,
              color: c.earth700,
              margin: 0,
            }}
          >
            Return #{returnRequest.id.slice(-8).toUpperCase()}
          </h1>
          <StatusBadge status={returnRequest.status} />
        </div>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            color: c.earth400,
            margin: "0.5rem 0 0 0",
          }}
        >
          Order{" "}
          <span style={{ color: c.primary500, fontWeight: 600 }}>
            #{returnRequest.orderNumber}
          </span>{" "}
          • Requested {formatDate(returnRequest.requestedAt)}
        </p>
      </div>

      {/* Two-Column Layout */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}
        className="lg:grid-cols-[1fr_minmax(320px,400px)]"
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Product Info Card */}
          <div
            style={{
              backgroundColor: c.card,
              borderRadius: "0.5rem",
              boxShadow: c.shadow,
              overflow: "hidden",
            }}
          >
            <div style={{ height: "4px", background: c.gradient }} />
            <div style={{ padding: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: c.earth700,
                  marginBottom: "1.5rem",
                }}
              >
                Product Information
              </h2>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {returnRequest.product.imageUrl ? (
                  <img
                    src={returnRequest.product.imageUrl}
                    alt={returnRequest.product.name}
                    style={{
                      width: "200px",
                      height: "200px",
                      objectFit: "cover",
                      borderRadius: "0.5rem",
                      border: `1px solid ${c.subtle}`,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      borderRadius: "0.5rem",
                      border: `1px solid ${c.subtle}`,
                      background: c.primary50,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Package size={48} style={{ color: c.earth300 }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <h3
                    style={{
                      fontFamily: fonts.body,
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      color: c.earth700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {returnRequest.product.name}
                  </h3>
                  {returnRequest.product.variantLabel && (
                    <p
                      style={{
                        fontFamily: fonts.body,
                        fontSize: "0.875rem",
                        color: c.earth400,
                        marginBottom: "0.75rem",
                      }}
                    >
                      {returnRequest.product.variantLabel}
                    </p>
                  )}
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      marginBottom: "1rem",
                      fontFamily: fonts.body,
                      fontSize: "0.875rem",
                    }}
                  >
                    <div>
                      <span style={{ color: c.earth400 }}>Quantity:</span>{" "}
                      <span style={{ color: c.earth700, fontWeight: 600 }}>
                        {returnRequest.product.quantity}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: c.earth400 }}>Price:</span>{" "}
                      <span style={{ color: c.earth700, fontWeight: 600 }}>
                        {formatCurrency(returnRequest.product.price, returnRequest.product.currency)}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <span
                      style={{
                        backgroundColor: c.secondary50,
                        color: c.secondary500,
                        fontFamily: fonts.body,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.375rem",
                      }}
                    >
                      {getReasonLabel(returnRequest.reason)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {returnRequest.isWithinReturnWindow ? (
                      <>
                        <CheckCircle2 size={20} color={c.success} />
                        <span
                          style={{
                            fontFamily: fonts.body,
                            fontSize: "0.875rem",
                            color: c.success,
                            fontWeight: 600,
                          }}
                        >
                          Within {returnRequest.returnWindowDays}-day return window
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle size={20} color={c.error} />
                        <span
                          style={{
                            fontFamily: fonts.body,
                            fontSize: "0.875rem",
                            color: c.error,
                            fontWeight: 600,
                          }}
                        >
                          Outside {returnRequest.returnWindowDays}-day return window
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes Card */}
          {returnRequest.customerNotes && (
            <div
              style={{
                backgroundColor: c.card,
                borderRadius: "0.5rem",
                boxShadow: c.shadow,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", background: c.gradient }} />
              <div style={{ padding: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "1rem",
                  }}
                >
                  Customer Notes
                </h2>
                <div
                  style={{
                    borderLeft: `4px solid ${c.primary400}`,
                    paddingLeft: "1rem",
                    backgroundColor: c.primary50,
                    padding: "1rem 1rem 1rem 1.5rem",
                    borderRadius: "0.375rem",
                  }}
                >
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      color: c.earth600,
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{returnRequest.customerNotes}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Photos Card */}
          {returnRequest.photos.length > 0 && (
            <div
              style={{
                backgroundColor: c.card,
                borderRadius: "0.5rem",
                boxShadow: c.shadow,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", background: c.gradient }} />
              <div style={{ padding: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "1rem",
                  }}
                >
                  Customer Photos
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {returnRequest.photos.map((photo) => (
                    <div key={photo.id}>
                      <button
                        onClick={() => setLightboxUrl(photo.url)}
                        style={{
                          border: "none",
                          padding: 0,
                          background: "transparent",
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            borderRadius: "0.375rem",
                            border: `1px solid ${c.subtle}`,
                            transition: "transform 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.05)"
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)"
                          }}
                        />
                      </button>
                      <p
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.75rem",
                          color: c.earth400,
                          marginTop: "0.5rem",
                          textAlign: "center",
                        }}
                      >
                        {photo.caption}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div
            style={{
              backgroundColor: c.card,
              borderRadius: "0.5rem",
              boxShadow: c.shadow,
              overflow: "hidden",
            }}
          >
            <div style={{ height: "4px", background: c.gradient }} />
            <div style={{ padding: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: c.earth700,
                  marginBottom: "1.5rem",
                }}
              >
                Timeline
              </h2>
              {returnRequest.timeline.length === 0 ? (
                <p style={{ fontFamily: fonts.body, fontSize: "0.875rem", color: c.earth400 }}>
                  No events yet.
                </p>
              ) : (
                <div style={{ position: "relative", paddingLeft: "2rem" }}>
                  {returnRequest.timeline.map((event, index) => (
                    <div
                      key={event.id}
                      style={{
                        position: "relative",
                        paddingBottom:
                          index === returnRequest.timeline.length - 1 ? 0 : "1.5rem",
                      }}
                    >
                      {/* Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-2rem",
                          top: "0.25rem",
                          width: "12px",
                          height: "12px",
                          borderRadius: "9999px",
                          backgroundColor: c.primary500,
                          border: `3px solid ${c.primary100}`,
                        }}
                      />
                      {/* Connector line */}
                      {index !== returnRequest.timeline.length - 1 && (
                        <div
                          style={{
                            position: "absolute",
                            left: "calc(-2rem + 5px)",
                            top: "1rem",
                            bottom: 0,
                            width: "2px",
                            backgroundColor: c.primary100,
                          }}
                        />
                      )}
                      {/* Content */}
                      <div>
                        <div
                          style={{
                            fontFamily: fonts.body,
                            fontSize: "0.9375rem",
                            fontWeight: 600,
                            color: c.earth700,
                          }}
                        >
                          {event.action}
                        </div>
                        <div
                          style={{
                            fontFamily: fonts.body,
                            fontSize: "0.875rem",
                            color: c.earth400,
                            marginTop: "0.25rem",
                          }}
                        >
                          By {event.author} • {formatDate(event.timestamp)}
                        </div>
                        {event.note && (
                          <div
                            style={{
                              fontFamily: fonts.body,
                              fontSize: "0.875rem",
                              color: c.earth600,
                              marginTop: "0.5rem",
                              backgroundColor: c.primary50,
                              padding: "0.75rem",
                              borderRadius: "0.375rem",
                            }}
                          >
                            {event.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Customer Info Card */}
          <div
            style={{
              backgroundColor: c.card,
              borderRadius: "0.5rem",
              boxShadow: c.shadow,
              overflow: "hidden",
            }}
          >
            <div style={{ height: "4px", background: c.gradient }} />
            <div style={{ padding: "1.5rem" }}>
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: c.earth700,
                  marginBottom: "1rem",
                }}
              >
                Customer Information
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <User size={18} color={c.earth400} />
                  <span
                    style={{ fontFamily: fonts.body, fontSize: "0.9375rem", color: c.earth700 }}
                  >
                    {returnRequest.customer.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Mail size={18} color={c.earth400} />
                  <span
                    style={{ fontFamily: fonts.body, fontSize: "0.9375rem", color: c.earth700 }}
                  >
                    {returnRequest.customer.email}
                  </span>
                </div>
                {returnRequest.customer.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <Phone size={18} color={c.earth400} />
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: "0.9375rem",
                        color: c.earth700,
                      }}
                    >
                      {returnRequest.customer.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Actions Card (pending / under_review) */}
          {showAdminActions && (
            <div
              style={{
                backgroundColor: c.card,
                borderRadius: "0.5rem",
                boxShadow: c.shadow,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", background: c.gradient }} />
              <div style={{ padding: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "1rem",
                  }}
                >
                  Review Return
                </h2>
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: fonts.body,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: c.earth700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    rows={4}
                    style={{
                      width: "100%",
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      color: c.earth700,
                      backgroundColor: c.bg,
                      border: `1px solid ${c.subtle}`,
                      borderRadius: "0.375rem",
                      padding: "0.75rem",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    style={{
                      flex: 1,
                      backgroundColor: isApproving ? "#6ee7b7" : c.success,
                      color: c.card,
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      padding: "0.75rem 1rem",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: isApproving ? "not-allowed" : "pointer",
                      boxShadow: c.shadow,
                    }}
                  >
                    {isApproving ? "Approving…" : "Approve"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isApproving || isRejecting}
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      color: c.error,
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      padding: "0.75rem 1rem",
                      border: `2px solid ${c.error}`,
                      borderRadius: "0.375rem",
                      cursor: isRejecting ? "not-allowed" : "pointer",
                    }}
                  >
                    {isRejecting ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Refund Processing Card (approved) */}
          {showRefundProcessing && (
            <div
              style={{
                backgroundColor: c.card,
                borderRadius: "0.5rem",
                boxShadow: c.shadow,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", background: c.gradient }} />
              <div style={{ padding: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "1rem",
                  }}
                >
                  Process Refund
                </h2>

                {/* Refund Type */}
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: fonts.body,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: c.earth700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Refund Type
                  </label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="radio"
                        name="refundType"
                        value="full"
                        checked={refundType === "full"}
                        onChange={() => {
                          setRefundType("full")
                          setRefundAmount(returnRequest.product.price.toString())
                        }}
                        style={{ accentColor: c.primary500 }}
                      />
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.9375rem",
                          color: c.earth700,
                        }}
                      >
                        Full
                      </span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <input
                        type="radio"
                        name="refundType"
                        value="partial"
                        checked={refundType === "partial"}
                        onChange={() => setRefundType("partial")}
                        style={{ accentColor: c.primary500 }}
                      />
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.9375rem",
                          color: c.earth700,
                        }}
                      >
                        Partial
                      </span>
                    </label>
                  </div>
                </div>

                {/* Partial amount input */}
                {refundType === "partial" && (
                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: fonts.body,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: c.earth700,
                        marginBottom: "0.5rem",
                      }}
                    >
                      Refund Amount
                    </label>
                    <div style={{ position: "relative" }}>
                      <CurrencyIcon
                        size={18}
                        color={c.earth400}
                        style={{
                          position: "absolute",
                          left: "0.75rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                        }}
                      />
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        step="0.01"
                        min="0"
                        max={returnRequest.product.price}
                        style={{
                          width: "100%",
                          fontFamily: fonts.body,
                          fontSize: "0.9375rem",
                          color: c.earth700,
                          backgroundColor: c.bg,
                          border: `1px solid ${c.subtle}`,
                          borderRadius: "0.375rem",
                          padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Refund Method */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: fonts.body,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: c.earth700,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Refund Method
                  </label>
                  <ThemeSelect
                    value={refundMethod}
                    onChange={(v) => setRefundMethod(v as RefundMethod)}
                    options={[
                      { value: "original_payment", label: "Original Payment Method" },
                      { value: "store_credit", label: "Store Credit (Gift Card)" },
                    ]}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    onClick={handleProcessRefund}
                    disabled={isProcessingRefund}
                    style={{
                      backgroundColor: isProcessingRefund ? c.primary200 : c.primary500,
                      color: c.card,
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      padding: "0.75rem 1rem",
                      border: "none",
                      borderRadius: "0.375rem",
                      cursor: isProcessingRefund ? "not-allowed" : "pointer",
                      boxShadow: c.shadow,
                    }}
                  >
                    {isProcessingRefund ? "Processing…" : "Process Refund"}
                  </button>
                  <button
                    onClick={handleInitiateExchange}
                    disabled={isInitiatingExchange}
                    style={{
                      backgroundColor: "transparent",
                      color: c.primary500,
                      fontFamily: fonts.body,
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      padding: "0.75rem 1rem",
                      border: `2px solid ${c.primary500}`,
                      borderRadius: "0.375rem",
                      cursor: isInitiatingExchange ? "not-allowed" : "pointer",
                    }}
                  >
                    {isInitiatingExchange ? "Initiating…" : "Initiate Exchange"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Refund Summary Card (refunded) */}
          {showRefundSummary && (
            <div
              style={{
                backgroundColor: c.card,
                borderRadius: "0.5rem",
                boxShadow: c.shadow,
                overflow: "hidden",
              }}
            >
              <div style={{ height: "4px", background: c.gradient }} />
              <div style={{ padding: "1.5rem" }}>
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: c.earth700,
                    marginBottom: "1rem",
                  }}
                >
                  Refund Summary
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {returnRequest.refundType && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span
                        style={{ fontFamily: fonts.body, fontSize: "0.875rem", color: c.earth400 }}
                      >
                        Refund Type
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: c.earth700,
                          textTransform: "capitalize",
                        }}
                      >
                        {returnRequest.refundType}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span
                      style={{ fontFamily: fonts.body, fontSize: "0.875rem", color: c.earth400 }}
                    >
                      Amount
                    </span>
                    <span
                      style={{
                        fontFamily: fonts.body,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: c.earth700,
                      }}
                    >
                      {formatCurrency(returnRequest.refundAmount, returnRequest.product.currency)}
                    </span>
                  </div>
                  {returnRequest.refundMethod && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.875rem",
                          color: c.earth400,
                        }}
                      >
                        Method
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: c.earth700,
                        }}
                      >
                        {returnRequest.refundMethod === "original_payment"
                          ? "Original Payment Method"
                          : "Store Credit"}
                      </span>
                    </div>
                  )}
                  {returnRequest.resolvedAt && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.875rem",
                          color: c.earth400,
                        }}
                      >
                        Completed
                      </span>
                      <span
                        style={{
                          fontFamily: fonts.body,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: c.earth700,
                        }}
                      >
                        {formatDate(returnRequest.resolvedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rejected state message */}
          {returnRequest.status === "rejected" && (
            <div
              style={{
                backgroundColor: c.errorLight,
                borderRadius: "0.5rem",
                padding: "1.5rem",
                border: `1px solid ${c.error}`,
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: c.error,
                  marginBottom: "0.5rem",
                }}
              >
                Return Rejected
              </h3>
              {returnRequest.adminNotes && (
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "0.875rem",
                    color: c.earth700,
                    margin: 0,
                  }}
                >
                  {returnRequest.adminNotes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  )
}
