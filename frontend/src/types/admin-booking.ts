/** Booking status */
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled"

/** Consultation type */
export type ConsultationType = "vastu_home" | "vastu_office" | "vastu_plot" | "general"

/** View mode */
export type BookingsViewMode = "calendar" | "list"

/** Day of week */
export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"

/** Slot duration in minutes */
export type SlotDuration = 30 | 45 | 60

/** A booking row */
export interface BookingRow {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  consultationType: ConsultationType
  date: string
  startTime: string
  endTime: string
  duration: SlotDuration
  status: BookingStatus
  meetingLink: string | null
  notes: string
}

/** Calendar day with booking count */
export interface CalendarDay {
  date: string
  bookingCount: number
  isBlocked: boolean
  isToday: boolean
}

/** Time slot configuration */
export interface TimeSlotConfig {
  enabledDays: DayOfWeek[]
  startTime: string
  endTime: string
  slotDuration: SlotDuration
  bufferMinutes: number
  maxBookingsPerDay: number
}

/** Blocked date */
export interface BlockedDate {
  id: string
  date: string
  reason: string
}

/** Props for the Admin Bookings section */
export interface AdminBookingsProps {
  bookings: BookingRow[]
  calendarDays: CalendarDay[]
  slotConfig: TimeSlotConfig
  blockedDates: BlockedDate[]
  selectedDate: string | null
  viewMode: BookingsViewMode
  isLoading?: boolean

  onChangeViewMode?: (mode: BookingsViewMode) => void
  onSelectDate?: (date: string) => void
  onViewBooking?: (bookingId: string) => void
  onUpdateStatus?: (bookingId: string, status: BookingStatus) => void
  onSetMeetingLink?: (bookingId: string, link: string) => void
  onAddNotes?: (bookingId: string, notes: string) => void
  onSendEmail?: (bookingId: string, type: "confirmation" | "reminder") => void
  onUpdateSlotConfig?: (config: TimeSlotConfig) => void
  onBlockDate?: (date: string, reason: string) => void
  onUnblockDate?: (blockedDateId: string) => void
}
