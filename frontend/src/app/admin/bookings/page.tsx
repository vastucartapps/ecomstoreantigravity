"use client"

import { useState, useEffect, useCallback } from "react"
import { AdminBookings, ServiceTypesPanel, BookingStatsPanel } from "@/components/admin/bookings"
import { useAdminBookings } from "@/hooks/useAdminBookings"
import type {
  BookingRow,
  BookingStatus,
  CalendarDay,
  TimeSlotConfig,
  BlockedDate,
  BookingsViewMode,
  AdminBookingServiceType,
  BookingStats,
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

type Tab = "bookings" | "services" | "stats"

const TABS: { id: Tab; label: string }[] = [
  { id: "bookings", label: "Bookings" },
  { id: "services", label: "Consultation Services" },
  { id: "stats", label: "Analytics" },
]

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
    fetchServiceTypes,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    fetchBookingStats,
    uploadFile,
  } = useAdminBookings()

  const [activeTab, setActiveTab] = useState<Tab>("bookings")
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
  const [serviceTypes, setServiceTypes] = useState<AdminBookingServiceType[]>([])
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<BookingsViewMode>("list")
  const [isLoading, setIsLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rows, cfg, blocked, types] = await Promise.all([
        fetchBookings(),
        fetchSlotConfig(),
        fetchBlockedDates(),
        fetchServiceTypes(),
      ])
      setBookings(rows)
      setSlotConfig(cfg)
      setBlockedDates(blocked)
      setServiceTypes(types)
    } finally {
      setIsLoading(false)
    }
  }, [fetchBookings, fetchSlotConfig, fetchBlockedDates, fetchServiceTypes])

  const loadStats = useCallback(async () => {
    if (bookingStats) return // already loaded
    setStatsLoading(true)
    const stats = await fetchBookingStats()
    setBookingStats(stats)
    setStatsLoading(false)
  }, [fetchBookingStats, bookingStats])

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === "stats") loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // ---------------------------------------------------------------------------
  // Booking handlers
  // ---------------------------------------------------------------------------

  const handleUpdateStatus = useCallback(
    async (id: string, status: BookingStatus) => {
      const ok = await updateStatus(id, status)
      if (ok) {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
        setBookingStats(null) // invalidate stats
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
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, meetingLink: link } : b)))
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
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, notes } : b)))
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
      showToast(ok ? `${type === "confirmation" ? "Confirmation" : "Reminder"} email sent` : "Failed to send email")
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

  // ---------------------------------------------------------------------------
  // Service type handlers
  // ---------------------------------------------------------------------------

  const handleAddServiceType = useCallback(
    async (data: Omit<AdminBookingServiceType, "id" | "created_at">) => {
      const result = await createServiceType(data)
      if (result) {
        setServiceTypes((prev) => [...prev, result])
        showToast("Service type created")
      } else {
        showToast("Failed to create service type")
      }
    },
    [createServiceType, showToast]
  )

  const handleUpdateServiceType = useCallback(
    async (id: string, data: Partial<Omit<AdminBookingServiceType, "id" | "created_at">>) => {
      const result = await updateServiceType(id, data)
      if (result) {
        setServiceTypes((prev) => prev.map((t) => (t.id === id ? result : t)))
        showToast("Service type updated")
      } else {
        showToast("Failed to update service type")
      }
    },
    [updateServiceType, showToast]
  )

  const handleDeleteServiceType = useCallback(
    async (id: string) => {
      const ok = await deleteServiceType(id)
      if (ok) {
        setServiceTypes((prev) => prev.filter((t) => t.id !== id))
        showToast("Service type deleted")
      } else {
        showToast("Failed to delete service type")
      }
    },
    [deleteServiceType, showToast]
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

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: "#f0ebe4" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? "#013f47" : "transparent",
              color: activeTab === tab.id ? "#fff" : "#9a7c68",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings tab */}
      {activeTab === "bookings" && (
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
      )}

      {/* Consultation Services tab */}
      {activeTab === "services" && (
        <ServiceTypesPanel
          serviceTypes={serviceTypes}
          onAdd={handleAddServiceType}
          onUpdate={handleUpdateServiceType}
          onDelete={handleDeleteServiceType}
          onToggleActive={(id, is_active) => handleUpdateServiceType(id, { is_active })}
          onUploadFile={uploadFile}
        />
      )}

      {/* Analytics tab */}
      {activeTab === "stats" && (
        <BookingStatsPanel
          stats={bookingStats ?? {
            total: 0,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
            totalRevenue: 0,
            todayCount: 0,
            thisWeekCount: 0,
            byServiceType: [],
          }}
          isLoading={statsLoading}
        />
      )}
    </>
  )
}
