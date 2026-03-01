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

/** Admin-managed consultation/service type */
export interface AdminBookingServiceType {
  id: string
  title: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  is_active: boolean
  display_order: number
  // Images (uploaded to MinIO, carousel of up to 3)
  image_1: string
  image_2: string
  image_3: string
  // Rich content
  what_is_included: string  // JSON: string[]
  outcomes: string
  mode: "online" | "offline" | "both"
  badge_text: string
  slug?: string
  created_at?: string
}

/** Booking analytics stats */
export interface BookingStats {
  total: number
  pending: number
  confirmed: number
  completed: number
  cancelled: number
  totalRevenue: number
  todayCount: number
  thisWeekCount: number
  byServiceType: { title: string; count: number; revenue: number }[]
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
