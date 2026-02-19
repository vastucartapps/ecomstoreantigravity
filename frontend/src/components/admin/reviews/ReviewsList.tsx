"use client"

import { useState, useMemo } from "react"
import { Star, CheckSquare, Square, ThumbsUp, ThumbsDown, ShieldCheck, Image as ImageIcon } from "lucide-react"
import type { ReviewItem, ReviewStatus, ReviewBulkAction } from "@/types/admin-review"

const c = {
  primary500: "#013f47", primary400: "#2a7a72", primary100: "#c5e8e2",
  secondary500: "#c85103", secondary50: "#fff5ed",
  bg: "#fffbf5", card: "#ffffff", subtle: "#f5dfbb",
  earth300: "#a39585", earth400: "#75615a", earth500: "#71685b", earth600: "#5a4f47", earth700: "#433b35",
  success: "#10B981", successLight: "#D1FAE5",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  error: "#EF4444", errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = { heading: "'Lora', serif", body: "'Open Sans', sans-serif", mono: "'IBM Plex Mono', monospace" }

interface ReviewsListProps {
  reviews: ReviewItem[]
  statusFilter: ReviewStatus | "all"
  searchQuery: string
  onChangeStatus: (status: ReviewStatus | "all") => void
  onApprove: (id: string, response?: string) => Promise<void>
  onReject: (id: string, reason?: string) => Promise<void>
  onBulkAction: (action: ReviewBulkAction, ids: string[]) => Promise<void>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={14}
          fill={s <= rating ? c.warning : "none"}
          stroke={s <= rating ? c.warning : c.earth300}
        />
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles: Record<ReviewStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: c.warningLight, text: c.warning, label: "Pending" },
    approved: { bg: c.successLight, text: c.success, label: "Approved" },
    rejected: { bg: c.errorLight, text: c.error, label: "Rejected" },
  }
  const s = styles[status]
  return (
    <span style={{ background: s.bg, color: s.text, padding: "3px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600 }}>
      {s.label}
    </span>
  )
}

export function ReviewsList({
  reviews,
  statusFilter,
  searchQuery,
  onChangeStatus,
  onApprove,
  onReject,
  onBulkAction,
}: ReviewsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<Record<string, string>>({})
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [bulkActioning, setBulkActioning] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = reviews
    if (statusFilter !== "all") result = result.filter(r => r.status === statusFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        r =>
          r.customerName.toLowerCase().includes(q) ||
          r.customerEmail.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q)
      )
    }
    return result
  }, [reviews, statusFilter, searchQuery])

  const counts = useMemo(() => ({
    all: reviews.length,
    pending: reviews.filter(r => r.status === "pending").length,
    approved: reviews.filter(r => r.status === "approved").length,
    rejected: reviews.filter(r => r.status === "rejected").length,
  }), [reviews])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)))
    }
  }

  const handleApprove = async (id: string) => {
    setActioningId(id)
    try {
      await onApprove(id, responseText[id] || undefined)
      setExpandedId(null)
      setResponseText(prev => { const n = { ...prev }; delete n[id]; return n })
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } finally {
      setActioningId(null)
    }
  }

  const handleReject = async (id: string) => {
    setActioningId(id)
    try {
      await onReject(id, responseText[id] || undefined)
      setExpandedId(null)
      setResponseText(prev => { const n = { ...prev }; delete n[id]; return n })
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n })
    } finally {
      setActioningId(null)
    }
  }

  const handleBulk = async (action: ReviewBulkAction) => {
    setBulkActioning(true)
    try {
      await onBulkAction(action, Array.from(selectedIds))
      setSelectedIds(new Set())
    } finally {
      setBulkActioning(false)
    }
  }

  const tabs: Array<{ key: ReviewStatus | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ]

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <img src={lightboxUrl} alt="Review photo" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px" }} />
        </div>
      )}

      {/* Status Sub-Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { onChangeStatus(tab.key); setSelectedIds(new Set()) }}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: statusFilter === tab.key ? "none" : `1px solid ${c.earth300}`,
              background: statusFilter === tab.key ? c.primary500 : c.card,
              color: statusFilter === tab.key ? c.card : c.earth600,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.label}
            <span
              style={{
                background: statusFilter === tab.key ? "rgba(255,255,255,0.2)" : c.earth300,
                color: statusFilter === tab.key ? c.card : c.earth700,
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: c.primary500,
            color: c.card,
            borderRadius: "10px",
            padding: "12px 20px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            {selectedIds.size} review{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => handleBulk("approve")}
              disabled={bulkActioning}
              style={{
                padding: "8px 16px", background: c.success, color: c.card,
                border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                cursor: bulkActioning ? "not-allowed" : "pointer",
              }}
            >
              {bulkActioning ? "Processing…" : "Approve All"}
            </button>
            <button
              onClick={() => handleBulk("reject")}
              disabled={bulkActioning}
              style={{
                padding: "8px 16px", background: c.error, color: c.card,
                border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                cursor: bulkActioning ? "not-allowed" : "pointer",
              }}
            >
              {bulkActioning ? "Processing…" : "Reject All"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: c.card,
                border: "1px solid rgba(255,255,255,0.3)", borderRadius: "6px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Select All row (when there are items) */}
      {filtered.length > 0 && (
        <div
          style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", cursor: "pointer" }}
          onClick={toggleSelectAll}
        >
          {selectedIds.size === filtered.length && filtered.length > 0
            ? <CheckSquare size={18} style={{ color: c.primary500 }} />
            : <Square size={18} style={{ color: c.earth400 }} />
          }
          <span style={{ fontSize: "13px", color: c.earth500 }}>
            {selectedIds.size === filtered.length && filtered.length > 0 ? "Deselect all" : "Select all"}
          </span>
        </div>
      )}

      {/* Review Cards */}
      <div style={{ display: "grid", gap: "16px" }}>
        {filtered.map(review => {
          const isExpanded = expandedId === review.id
          const isActioning = actioningId === review.id
          const isSelected = selectedIds.has(review.id)

          return (
            <div
              key={review.id}
              style={{
                background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: c.shadow,
                borderTop: "4px solid transparent",
                opacity: isActioning ? 0.7 : 1,
                transition: "opacity 200ms",
              }}
            >
              {/* Card Top Row */}
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {/* Checkbox */}
                <div
                  style={{ cursor: "pointer", paddingTop: "2px", flexShrink: 0 }}
                  onClick={() => toggleSelect(review.id)}
                >
                  {isSelected
                    ? <CheckSquare size={20} style={{ color: c.primary500 }} />
                    : <Square size={20} style={{ color: c.earth300 }} />
                  }
                </div>

                {/* Product Thumbnail */}
                <div style={{ flexShrink: 0 }}>
                  {review.productImageUrl ? (
                    <img
                      src={review.productImageUrl}
                      alt={review.productName}
                      style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "8px",
                      background: c.subtle, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ImageIcon size={24} style={{ color: c.earth400 }} />
                    </div>
                  )}
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Product + Status row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: c.earth500, fontWeight: 600 }}>
                      {review.productName}
                    </span>
                    <StatusBadge status={review.status} />
                    {review.isVerifiedPurchase && (
                      <span style={{
                        display: "flex", alignItems: "center", gap: "4px",
                        background: c.primary100, color: c.primary500,
                        padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                      }}>
                        <ShieldCheck size={11} />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Star rating + title */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <StarRating rating={review.rating} />
                    <span style={{ fontWeight: 700, color: c.earth700, fontSize: "15px" }}>
                      {review.title}
                    </span>
                  </div>

                  {/* Review text */}
                  <p style={{ color: c.earth600, fontSize: "14px", lineHeight: 1.6, margin: "0 0 10px 0" }}>
                    {review.text}
                  </p>

                  {/* Customer photos */}
                  {review.photos.length > 0 && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                      {review.photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Review photo ${i + 1}`}
                          onClick={() => setLightboxUrl(url)}
                          style={{
                            width: "60px", height: "60px", borderRadius: "6px",
                            objectFit: "cover", cursor: "pointer",
                            border: `2px solid ${c.earth300}`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Customer + Date */}
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px" }}>
                    <span style={{ color: c.earth700, fontSize: "13px", fontWeight: 600 }}>
                      {review.customerName}
                    </span>
                    {review.customerEmail && (
                      <span style={{ color: c.earth500, fontSize: "12px" }}>{review.customerEmail}</span>
                    )}
                    <span style={{ color: c.earth400, fontSize: "12px" }}>{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Admin response (if approved) */}
                  {review.adminResponse && review.status === "approved" && (
                    <div style={{
                      background: c.primary100,
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "10px",
                      fontSize: "13px",
                      color: c.primary500,
                    }}>
                      <span style={{ fontWeight: 700 }}>Admin reply: </span>
                      {review.adminResponse}
                    </div>
                  )}

                  {/* Rejection reason */}
                  {review.adminResponse && review.status === "rejected" && (
                    <div style={{
                      background: c.errorLight,
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "10px",
                      fontSize: "13px",
                      color: c.error,
                    }}>
                      <span style={{ fontWeight: 700 }}>Rejection reason: </span>
                      {review.adminResponse}
                    </div>
                  )}

                  {/* Action buttons (for pending reviews) */}
                  {review.status === "pending" && (
                    <div>
                      {!isExpanded ? (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setExpandedId(review.id)}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              padding: "8px 14px", background: c.success, color: c.card,
                              border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <ThumbsUp size={14} /> Approve
                          </button>
                          <button
                            onClick={async () => await handleReject(review.id)}
                            disabled={isActioning}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              padding: "8px 14px", background: c.error, color: c.card,
                              border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                              cursor: isActioning ? "not-allowed" : "pointer",
                            }}
                          >
                            <ThumbsDown size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <div style={{ marginTop: "8px" }}>
                          <textarea
                            value={responseText[review.id] || ""}
                            onChange={e => setResponseText(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Optional: type an admin response to the reviewer…"
                            style={{
                              width: "100%", minHeight: "70px", padding: "10px",
                              border: `1px solid ${c.earth300}`, borderRadius: "8px",
                              fontSize: "13px", fontFamily: fonts.body, resize: "vertical",
                              outline: "none", boxSizing: "border-box", marginBottom: "10px",
                            }}
                            onFocus={e => (e.target.style.borderColor = c.primary400)}
                            onBlur={e => (e.target.style.borderColor = c.earth300)}
                          />
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleApprove(review.id)}
                              disabled={isActioning}
                              style={{
                                padding: "8px 16px", background: c.success, color: c.card,
                                border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                                cursor: isActioning ? "not-allowed" : "pointer",
                              }}
                            >
                              {isActioning ? "Approving…" : "Confirm Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(review.id)}
                              disabled={isActioning}
                              style={{
                                padding: "8px 16px", background: c.error, color: c.card,
                                border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600,
                                cursor: isActioning ? "not-allowed" : "pointer",
                              }}
                            >
                              {isActioning ? "Rejecting…" : "Reject with Note"}
                            </button>
                            <button
                              onClick={() => { setExpandedId(null); setResponseText(prev => { const n = { ...prev }; delete n[review.id]; return n }) }}
                              style={{
                                padding: "8px 14px", background: "transparent",
                                border: `1px solid ${c.earth300}`, borderRadius: "6px",
                                fontSize: "13px", fontWeight: 600, color: c.earth600, cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty States */}
      {filtered.length === 0 && (
        <div style={{
          padding: "64px 32px", textAlign: "center", color: c.earth500,
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px", borderTop: "4px solid transparent", boxShadow: c.shadow,
        }}>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: c.earth700 }}>
            {statusFilter === "pending"
              ? "All caught up — no pending reviews"
              : searchQuery
                ? "No results match your search"
                : "No reviews found"}
          </p>
          <p style={{ fontSize: "14px", color: c.earth400 }}>
            {statusFilter === "pending"
              ? "All new reviews have been moderated."
              : "Try adjusting your filters."}
          </p>
        </div>
      )}
    </div>
  )
}
