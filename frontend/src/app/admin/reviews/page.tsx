"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminReviewsQA } from "@/components/admin/reviews"
import { useAdminReviews } from "@/hooks/useAdminReviews"
import type {
  ReviewItem,
  QAItem,
  ModerationTab,
  ReviewStatus,
  QAStatus,
  ReviewBulkAction,
} from "@/types/admin-review"

export default function ReviewsModerationPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [qaItems, setQaItems] = useState<QAItem[]>([])
  const [activeTab, setActiveTab] = useState<ModerationTab>("reviews")
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus | "all">("pending")
  const [qaStatusFilter, setQaStatusFilter] = useState<QAStatus | "all">("unanswered")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const {
    fetchReviews,
    approveReview,
    rejectReview,
    bulkAction,
    fetchQA,
    answerQuestion,
    editAnswer,
    deleteAnswer,
  } = useAdminReviews()

  const showToast = useCallback((message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [reviewsRes, qaRes] = await Promise.all([
        fetchReviews(),
        fetchQA(),
      ])
      setReviews(reviewsRes.reviews)
      setQaItems(qaRes.questions)
    } catch {
      showToast("Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [fetchReviews, fetchQA, showToast])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChangeTab = useCallback((tab: ModerationTab) => {
    setActiveTab(tab)
    setSearchQuery("")
  }, [])

  const handleApproveReview = useCallback(
    async (reviewId: string, response?: string) => {
      const ok = await approveReview(reviewId, response)
      if (ok) {
        // Optimistically update local state
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, status: "approved" as ReviewStatus, adminResponse: response || null }
              : r
          )
        )
        showToast("Review approved")
      } else {
        showToast("Failed to approve review")
        throw new Error("Approve failed")
      }
    },
    [approveReview, showToast]
  )

  const handleRejectReview = useCallback(
    async (reviewId: string, reason?: string) => {
      const ok = await rejectReview(reviewId, reason)
      if (ok) {
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? { ...r, status: "rejected" as ReviewStatus, adminResponse: reason || null }
              : r
          )
        )
        showToast("Review rejected")
      } else {
        showToast("Failed to reject review")
        throw new Error("Reject failed")
      }
    },
    [rejectReview, showToast]
  )

  const handleBulkAction = useCallback(
    async (action: ReviewBulkAction, reviewIds: string[]) => {
      const ok = await bulkAction(action, reviewIds)
      if (ok) {
        const newStatus = action === "approve" ? "approved" : "rejected"
        setReviews(prev =>
          prev.map(r =>
            reviewIds.includes(r.id) ? { ...r, status: newStatus as ReviewStatus } : r
          )
        )
        showToast(`${reviewIds.length} review${reviewIds.length > 1 ? "s" : ""} ${newStatus}`)
      } else {
        showToast("Bulk action failed")
        throw new Error("Bulk failed")
      }
    },
    [bulkAction, showToast]
  )

  const handleAnswerQuestion = useCallback(
    async (qaId: string, answer: string) => {
      const ok = await answerQuestion(qaId, answer)
      if (ok) {
        setQaItems(prev =>
          prev.map(q =>
            q.id === qaId
              ? { ...q, status: "answered" as QAStatus, answer, answeredBy: "VastuCart Team", answeredAt: new Date().toISOString() }
              : q
          )
        )
        showToast("Answer submitted")
      } else {
        showToast("Failed to submit answer")
        throw new Error("Answer failed")
      }
    },
    [answerQuestion, showToast]
  )

  const handleEditAnswer = useCallback(
    async (qaId: string, answer: string) => {
      const ok = await editAnswer(qaId, answer)
      if (ok) {
        setQaItems(prev =>
          prev.map(q =>
            q.id === qaId
              ? { ...q, answer, answeredAt: new Date().toISOString() }
              : q
          )
        )
        showToast("Answer updated")
      } else {
        showToast("Failed to update answer")
        throw new Error("Edit failed")
      }
    },
    [editAnswer, showToast]
  )

  const handleDeleteAnswer = useCallback(
    async (qaId: string) => {
      const ok = await deleteAnswer(qaId)
      if (ok) {
        setQaItems(prev =>
          prev.map(q =>
            q.id === qaId
              ? { ...q, status: "unanswered" as QAStatus, answer: null, answeredBy: null, answeredAt: null }
              : q
          )
        )
        showToast("Answer deleted")
      } else {
        showToast("Failed to delete answer")
        throw new Error("Delete failed")
      }
    },
    [deleteAnswer, showToast]
  )

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

      <AdminReviewsQA
        reviews={reviews}
        qaItems={qaItems}
        activeTab={activeTab}
        reviewStatusFilter={reviewStatusFilter}
        qaStatusFilter={qaStatusFilter}
        searchQuery={searchQuery}
        isLoading={isLoading}
        onChangeTab={handleChangeTab}
        onChangeReviewStatus={setReviewStatusFilter}
        onChangeQAStatus={setQaStatusFilter}
        onSearch={setSearchQuery}
        onApproveReview={handleApproveReview}
        onRejectReview={handleRejectReview}
        onBulkAction={handleBulkAction}
        onAnswerQuestion={handleAnswerQuestion}
        onEditAnswer={handleEditAnswer}
        onDeleteAnswer={handleDeleteAnswer}
      />
    </>
  )
}
