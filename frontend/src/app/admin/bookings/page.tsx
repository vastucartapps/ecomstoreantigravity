"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminBookings } from "@/components/admin/bookings"
import { useAdminBookings } from "@/hooks/useAdminBookings"
import type {
  BookingRow,
  BookingStatus,
  CalendarDay,
  TimeSlotConfig,
  BlockedDate,
  BookingsViewMode,
} from "@/types/admin-booking"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeCalendarDays(
  bookings: BookingRow[],
  blockedDates: BlockedDate[]
): CalendarDay[] {
  const today = new Date().toISOString().split("T")[0]
  const blockedSet = new Set(blockedDates.map((bd) => bd.date))
  const bookingCounts: Record<string, number> = {}
  for (const b of bookings) {
    bookingCounts[b.date] = (bookingCounts[b.date] || 0) + 1
  }
  const allDates = new Set([
    ...Object.keys(bookingCounts),
    ...Array.from(blockedSet),
  ])
  return Array.from(allDates).map((date) => ({
    date,
    bookingCount: bookingCounts[date] || 0,
    isBlocked: blockedSet.has(date),
    isToday: date === today,
  }))
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBookingsPage() {
  const {
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
  } = useAdminBookings()

  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [slotConfig, setSlotConfig] = useState<TimeSlotConfig>({
    enabledDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    startTime: "10:00",
    endTime: "18:00",
    slotDuration: 45,
    bufferMinutes: 15,
    maxBookingsPerDay: 8,
  })
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BookingsViewMode>("list")
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rows, cfg, blocked] = await Promise.all([
        fetchBookings(),
        fetchSlotConfig(),
        fetchBlockedDates(),
      ])
      setBookings(rows)
      setSlotConfig(cfg)
      setBlockedDates(blocked)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBookings, fetchSlotConfig, fetchBlockedDates])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleUpdateStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      const ok = await updateStatus(id, status)
      if (ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status } : b))
        )
        showToast(`Booking marked as ${status}`)
      } else {
        showToast("Failed to update status")
      }
    },
    [updateStatus, showToast]
  )

  const handleSetMeetingLink = useCallback(
    async (id: string, link: string) => {
      const ok = await setMeetingLink(id, link)
      if (ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, meetingLink: link } : b))
        )
        showToast("Meeting link saved")
      } else {
        showToast("Failed to save meeting link")
      }
    },
    [setMeetingLink, showToast]
  )

  const handleAddNotes = useCallback(
    async (id: string, notes: string) => {
      const ok = await addNotes(id, notes)
      if (ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, notes } : b))
        )
        showToast("Notes saved")
      } else {
        showToast("Failed to save notes")
      }
    },
    [addNotes, showToast]
  )

  const handleSendEmail = useCallback(
    async (id: string, type: "confirmation" | "reminder") => {
      const ok = await sendEmail(id, type)
      if (ok) {
        showToast(
          `${type === "confirmation" ? "Confirmation" : "Reminder"} email sent`
        )
      } else {
        showToast("Failed to send email")
      }
    },
    [sendEmail, showToast]
  )

  const handleUpdateSlotConfig = useCallback(
    async (config: TimeSlotConfig) => {
      const ok = await updateSlotConfig(config)
      if (ok) {
        setSlotConfig(config)
        showToast("Settings saved")
      } else {
        showToast("Failed to save settings")
      }
    },
    [updateSlotConfig, showToast]
  )

  const handleBlockDate = useCallback(
    async (date: string, reason: string) => {
      const newBlocked = await blockDate(date, reason)
      if (newBlocked) {
        setBlockedDates((prev) => [...prev, newBlocked])
        showToast("Date blocked")
      } else {
        showToast("Failed to block date")
      }
    },
    [blockDate, showToast]
  )

  const handleUnblockDate = useCallback(
    async (id: string) => {
      const ok = await unblockDate(id)
      if (ok) {
        setBlockedDates((prev) => prev.filter((bd) => bd.id !== id))
        showToast("Date unblocked")
      } else {
        showToast("Failed to unblock date")
      }
    },
    [unblockDate, showToast]
  )

  const calendarDays = computeCalendarDays(bookings, blockedDates)

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            right: "16px",
            zIndex: 9999,
            padding: "12px 18px",
            borderRadius: "8px",
            background: "#013f47",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxWidth: "320px",
          }}
        >
          {toast}
        </div>
      )}

      <AdminBookings
        bookings={bookings}
        calendarDays={calendarDays}
        slotConfig={slotConfig}
        blockedDates={blockedDates}
        selectedDate={selectedDate}
        viewMode={viewMode}
        isLoading={isLoading}
        onChangeViewMode={setViewMode}
        onSelectDate={setSelectedDate}
        onUpdateStatus={handleUpdateStatus}
        onSetMeetingLink={handleSetMeetingLink}
        onAddNotes={handleAddNotes}
        onSendEmail={handleSendEmail}
        onUpdateSlotConfig={handleUpdateSlotConfig}
        onBlockDate={handleBlockDate}
        onUnblockDate={handleUnblockDate}
      />
    </>
  )
}
