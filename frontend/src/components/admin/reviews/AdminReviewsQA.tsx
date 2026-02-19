"use client"

import { Search } from "lucide-react"
import type { AdminReviewsQAProps } from "@/types/admin-review"
import { ReviewsList } from "./ReviewsList"
import { QAList } from "./QAList"

const c = {
  primary500: "#013f47", primary400: "#2a7a72", primary100: "#c5e8e2",
  secondary500: "#c85103",
  bg: "#fffbf5", card: "#ffffff", subtle: "#f5dfbb",
  earth300: "#a39585", earth400: "#75615a", earth600: "#5a4f47", earth700: "#433b35",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = { heading: "'Lora', serif", body: "'Open Sans', sans-serif" }

export function AdminReviewsQA({
  reviews,
  qaItems,
  activeTab,
  reviewStatusFilter,
  qaStatusFilter,
  searchQuery,
  isLoading,
  onChangeTab,
  onChangeReviewStatus,
  onChangeQAStatus,
  onSearch,
  onApproveReview,
  onRejectReview,
  onBulkAction,
  onAnswerQuestion,
  onEditAnswer,
  onDeleteAnswer,
}: AdminReviewsQAProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div
            className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full mx-auto mb-3"
            style={{ borderColor: c.primary500, borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: c.earth400, fontFamily: fonts.body }}>
            Loading…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Page Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: "32px", fontWeight: 600, color: c.earth700, margin: "0 0 4px 0" }}>
          Reviews & Q&A
        </h1>
        <p style={{ color: c.earth400, fontSize: "14px", margin: 0 }}>
          Moderate customer reviews and product questions
        </p>
      </div>

      {/* Main Tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: `2px solid ${c.subtle}`,
          marginBottom: "24px",
          gap: "0",
        }}
      >
        {(["reviews", "qa"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onChangeTab?.(tab)}
            style={{
              padding: "12px 24px",
              border: "none",
              borderBottom: activeTab === tab ? `3px solid ${c.primary500}` : "3px solid transparent",
              background: "transparent",
              color: activeTab === tab ? c.primary500 : c.earth400,
              fontSize: "15px",
              fontWeight: activeTab === tab ? 700 : 600,
              cursor: "pointer",
              transition: "all 200ms",
              fontFamily: fonts.body,
              marginBottom: "-2px",
            }}
          >
            {tab === "reviews" ? (
              <>Reviews {reviews.filter(r => r.status === "pending").length > 0 && (
                <span style={{
                  background: c.secondary500,
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "2px 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  marginLeft: "6px",
                }}>
                  {reviews.filter(r => r.status === "pending").length}
                </span>
              )}</>
            ) : (
              <>Q&amp;A {qaItems.filter(q => q.status === "unanswered").length > 0 && (
                <span style={{
                  background: c.secondary500,
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "2px 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  marginLeft: "6px",
                }}>
                  {qaItems.filter(q => q.status === "unanswered").length}
                </span>
              )}</>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: "24px", position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)", color: c.earth400,
          }}
        />
        <input
          type="text"
          placeholder={
            activeTab === "reviews"
              ? "Search by product name, customer name, or email…"
              : "Search by product name or customer…"
          }
          value={searchQuery}
          onChange={e => onSearch?.(e.target.value)}
          style={{
            width: "100%",
            padding: "11px 16px 11px 44px",
            border: `1px solid ${c.earth300}`,
            borderRadius: "8px",
            fontSize: "14px",
            fontFamily: fonts.body,
            outline: "none",
            background: c.card,
            boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = c.primary400)}
          onBlur={e => (e.target.style.borderColor = c.earth300)}
        />
      </div>

      {/* Tab Content */}
      {activeTab === "reviews" ? (
        <ReviewsList
          reviews={reviews}
          statusFilter={reviewStatusFilter}
          searchQuery={searchQuery}
          onChangeStatus={status => onChangeReviewStatus?.(status)}
          onApprove={async (id, response) => { await onApproveReview?.(id, response) }}
          onReject={async (id, reason) => { await onRejectReview?.(id, reason) }}
          onBulkAction={async (action, ids) => { await onBulkAction?.(action, ids) }}
        />
      ) : (
        <QAList
          qaItems={qaItems}
          statusFilter={qaStatusFilter}
          searchQuery={searchQuery}
          onChangeStatus={status => onChangeQAStatus?.(status)}
          onAnswer={async (id, answer) => { await onAnswerQuestion?.(id, answer) }}
          onEdit={async (id, answer) => { await onEditAnswer?.(id, answer) }}
          onDelete={async (id) => { await onDeleteAnswer?.(id) }}
        />
      )}
    </div>
  )
}
