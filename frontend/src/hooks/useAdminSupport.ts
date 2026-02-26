import { useCallback } from "react"
import { adminFetch } from "@/lib/medusa"

export interface SupportTicket {
  id: string
  customer_id: string
  customer_email: string
  customer_name: string
  category: string
  message: string
  status: "open" | "closed"
  admin_reply?: string
  admin_reply_at?: string
  admin_reply_by?: string
  created_at: string
  updated_at: string
}

export function useAdminSupport() {
  const fetchTickets = useCallback(async (
    status?: "open" | "closed" | "all",
    limit = 100
  ): Promise<{ tickets: SupportTicket[]; count: number }> => {
    const params = new URLSearchParams({ limit: String(limit) })
    if (status && status !== "all") params.set("status", status)

    const res = await adminFetch<{ tickets: SupportTicket[]; count: number }>(
      `/admin/support-tickets?${params}`
    )
    return { tickets: (res as any).tickets || [], count: (res as any).count || 0 }
  }, [])

  const replyTicket = useCallback(async (
    id: string,
    reply: string,
    repliedBy = "VastuCart Support"
  ): Promise<boolean> => {
    try {
      await adminFetch(`/admin/support-tickets/${id}/reply`, {
        method: "POST",
        body: { reply, replied_by: repliedBy },
      })
      return true
    } catch {
      return false
    }
  }, [])

  return { fetchTickets, replyTicket }
}
