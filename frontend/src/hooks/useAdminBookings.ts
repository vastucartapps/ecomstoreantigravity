"use client"

import { useCallback } from "react"
import { adminFetch } from "@/lib/medusa"
import type {
  BookingRow,
  BookingStatus,
  TimeSlotConfig,
  BlockedDate,
  ConsultationType,
  SlotDuration,
} from "@/types/admin-booking"
import type { MedusaBooking, MedusaCustomer } from "@/types/medusa-api"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONSULTATION_TYPES: ConsultationType[] = [
  "vastu_home",
  "vastu_office",
  "vastu_plot",
  "general",
]

function getConsultationType(title: string): ConsultationType {
  const lower = (title || "").toLowerCase()
  if (CONSULTATION_TYPES.includes(title as ConsultationType)) {
    return title as ConsultationType
  }
  if (lower.includes("home")) return "vastu_home"
  if (lower.includes("office")) return "vastu_office"
  if (lower.includes("plot")) return "vastu_plot"
  return "general"
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = (time || "10:00").split(":").map(Number)
  const total = h * 60 + m + minutes
  const endH = Math.floor(total / 60) % 24
  const endM = total % 60
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`
}

function mapBookingToRow(booking: MedusaBooking, customer: MedusaCustomer | null): BookingRow {
  const startTime = booking.time || "10:00"
  const customerName: string = customer
    ? `${customer.first_name || ""} ${customer.last_name || ""}`.trim() ||
      customer.email ||
      booking.customer_id ||
      "Unknown"
    : booking.customer_id || "Unknown"

  return {
    id: booking.id,
    customerName,
    customerEmail: customer?.email || "",
    customerPhone: customer?.phone || "",
    consultationType: getConsultationType(booking.title || ""),
    date: booking.date || "",
    startTime,
    endTime: addMinutes(startTime, 45),
    duration: 45 as SlotDuration,
    status: (booking.status || "pending") as BookingStatus,
    meetingLink: booking.meeting_link || null,
    notes: booking.notes || "",
  }
}

const DEFAULT_SLOT_CONFIG: TimeSlotConfig = {
  enabledDays: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ],
  startTime: "10:00",
  endTime: "18:00",
  slotDuration: 45,
  bufferMinutes: 15,
  maxBookingsPerDay: 8,
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminBookings() {
  const fetchBookings = useCallback(async (status?: string): Promise<BookingRow[]> => {
    try {
      const params = status ? `?status=${status}` : ""
      const res = await adminFetch<{ bookings: MedusaBooking[] }>(`/admin/bookings${params}`)
      const bookings = res.bookings || []

      // Batch-fetch unique customers in parallel
      const customerIds = [
        ...new Set(
          bookings.map((b) => b.customer_id).filter(Boolean) as string[]
        ),
      ]
      const customerMap: Record<string, MedusaCustomer> = {}
      await Promise.all(
        customerIds.map(async (id) => {
          try {
            const cRes = await adminFetch<{ customer: MedusaCustomer }>(
              `/admin/customers/${id}?fields=id,first_name,last_name,email,phone`
            )
            if (cRes.customer) customerMap[id] = cRes.customer
          } catch {
            // customer fetch failed — will show customer_id as name
          }
        })
      )

      return bookings.map((b) =>
        mapBookingToRow(b, customerMap[b.customer_id ?? ""] ?? null)
      )
    } catch {
      return []
    }
  }, [])

  const updateStatus = useCallback(
    async (id: string, status: BookingStatus): Promise<boolean> => {
      try {
        await adminFetch(`/admin/bookings/${id}`, {
          method: "POST",
          body: { status },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const setMeetingLink = useCallback(
    async (id: string, link: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/bookings/${id}`, {
          method: "POST",
          body: { meeting_link: link },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const addNotes = useCallback(
    async (id: string, notes: string): Promise<boolean> => {
      try {
        await adminFetch(`/admin/bookings/${id}`, {
          method: "POST",
          body: { notes },
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  // In production, this would trigger a Medusa notification (SendGrid/etc.)
  const sendEmail = useCallback(
    async (_id: string, _type: "confirmation" | "reminder"): Promise<boolean> => {
      return true
    },
    []
  )

  const fetchSlotConfig = useCallback(async (): Promise<TimeSlotConfig> => {
    try {
      const res = await adminFetch<{ config: TimeSlotConfig }>("/admin/bookings/slot-config")
      return res.config || DEFAULT_SLOT_CONFIG
    } catch {
      return DEFAULT_SLOT_CONFIG
    }
  }, [])

  const updateSlotConfig = useCallback(
    async (config: TimeSlotConfig): Promise<boolean> => {
      try {
        await adminFetch("/admin/bookings/slot-config", {
          method: "POST",
          body: config as unknown as Record<string, unknown>,
        })
        return true
      } catch {
        return false
      }
    },
    []
  )

  const fetchBlockedDates = useCallback(async (): Promise<BlockedDate[]> => {
    try {
      const res = await adminFetch<{ blocked_dates: BlockedDate[] }>(
        "/admin/bookings/blocked-dates"
      )
      return res.blocked_dates || []
    } catch {
      return []
    }
  }, [])

  const blockDate = useCallback(
    async (date: string, reason: string): Promise<BlockedDate | null> => {
      try {
        const res = await adminFetch<{ blocked_date: BlockedDate }>(
          "/admin/bookings/blocked-dates",
          {
            method: "POST",
            body: { date, reason },
          }
        )
        return res.blocked_date || null
      } catch {
        return null
      }
    },
    []
  )

  const unblockDate = useCallback(async (id: string): Promise<boolean> => {
    try {
      await adminFetch(`/admin/bookings/blocked-dates/${id}`, {
        method: "DELETE",
      })
      return true
    } catch {
      return false
    }
  }, [])

  return {
    fetchBookings,
    updateStatus,
    setMeetingLink,
    addNotes,
    sendEmail,
    fetchSlotConfig,
    updateSlotConfig,
    fetchBlockedDates,
    blockDate,
    unblockDate,
  }
}
