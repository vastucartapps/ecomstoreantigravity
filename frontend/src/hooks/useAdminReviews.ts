"use client"

import { useCallback } from "react"
import { medusa, adminFetch } from "@/lib/medusa"
import type { ReviewItem, QAItem, ReviewBulkAction, ReviewStatus, QAStatus } from "@/types/admin-review"

export function useAdminReviews() {
  const fetchReviews = useCallback(
    async (
      status?: ReviewStatus | "all",
      search?: string
    ): Promise<{ reviews: ReviewItem[]; count: number }> => {
      const params = new URLSearchParams()
      if (status && status !== "all") params.set("status", status)
      if (search) params.set("search", search)
      params.set("limit", "200")

      const res = await adminFetch<{ reviews: ReviewItem[]; count: number }>(
        `/admin/reviews?${params.toString()}`
      )
      return { reviews: res.reviews || [], count: res.count || 0 }
    },
    []
  )

  const approveReview = useCallback(
    async (reviewId: string, adminResponse?: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/reviews/${reviewId}/approve`, {
          method: "POST",
          body: { admin_response: adminResponse || null },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const rejectReview = useCallback(
    async (reviewId: string, reason?: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/reviews/${reviewId}/reject`, {
          method: "POST",
          body: { reason: reason || null },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const bulkAction = useCallback(
    async (action: ReviewBulkAction, reviewIds: string[]): Promise<boolean> => {
      try {
        await adminFetch("/admin/reviews/bulk", {
          method: "POST",
          body: { action, review_ids: reviewIds },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const fetchQA = useCallback(
    async (
      status?: QAStatus | "all",
      search?: string
    ): Promise<{ questions: QAItem[]; count: number }> => {
      const params = new URLSearchParams()
      if (status && status !== "all") params.set("status", status)
      if (search) params.set("search", search)
      params.set("limit", "200")

      const res = await adminFetch<{ questions: QAItem[]; count: number }>(
        `/admin/qa?${params.toString()}`
      )
      return { questions: res.questions || [], count: res.count || 0 }
    },
    []
  )

  const answerQuestion = useCallback(
    async (qaId: string, answer: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/qa/${qaId}/answer`, {
          method: "POST",
          body: { answer },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const editAnswer = useCallback(
    async (qaId: string, answer: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/qa/${qaId}/answer`, {
          method: "POST",
          body: { answer },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const deleteAnswer = useCallback(
    async (qaId: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/qa/${qaId}/answer`, {
          method: "DELETE",
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  return {
    fetchReviews,
    approveReview,
    rejectReview,
    bulkAction,
    fetchQA,
    answerQuestion,
    editAnswer,
    deleteAnswer,
  }
}
