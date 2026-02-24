"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Mail,
  Check,
  X,
  ExternalLink,
  Clock,
  User,
  Phone,
  Video,
  FileText,
  AlertCircle,
} from "lucide-react"
import { ThemeSelect } from "@/components/ui/ThemeSelect"
import type {
  AdminBookingsProps,
  BookingRow,
  CalendarDay,
  TimeSlotConfig,
  BlockedDate,
  BookingsViewMode,
  BookingStatus,
  ConsultationType,
  DayOfWeek,
} from "@/types/admin-booking"

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const c = {
  primary500: "#013f47",
  primary400: "#2a7a72",
  primary200: "#71c1ae",
  primary100: "#c5e8e2",
  primary50: "#e8f5f3",
  secondary500: "#c85103",
  secondary300: "#fd8630",
  secondary50: "#fff5ed",
  bg: "#fffbf5",
  card: "#ffffff",
  subtle: "#f5dfbb",
  earth300: "#a39585",
  earth400: "#75615a",
  earth500: "#71685b",
  earth600: "#5a4f47",
  earth700: "#433b35",
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
  mono: "'IBM Plex Mono', monospace",
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const consultationTypeLabels: Record<ConsultationType, string> = {
  vastu_home: "Home Vastu",
  vastu_office: "Office Vastu",
  vastu_plot: "Plot Vastu",
  general: "General",
}

const statusColors: Record<
  BookingStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: c.warningLight, text: c.warning, border: c.warning },
  confirmed: { bg: c.primary50, text: c.primary500, border: c.primary400 },
  completed: { bg: c.successLight, text: c.success, border: c.success },
  cancelled: { bg: c.errorLight, text: c.error, border: c.error },
}

const dayLabels: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

type ViewState = "main" | "booking-detail" | "settings"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":")
  const h = parseInt(hours)
  const ampm = h >= 12 ? "PM" : "AM"
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${displayHour}:${minutes} ${ampm}`
}

function formatDateTime(date: string, time: string): string {
  return `${formatDate(date)} at ${formatTime(time)}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const colors = statusColors[status]
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "600",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  )
}

const TypeBadge = ({ type }: { type: ConsultationType }) => (
  <span
    style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "600",
      backgroundColor: c.secondary50,
      color: c.secondary500,
      border: `1px solid ${c.secondary300}`,
    }}
  >
    {consultationTypeLabels[type]}
  </span>
)

const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: "500",
        color: c.primary500,
        backgroundColor: c.primary50,
        border: `1px solid ${c.primary200}`,
        cursor: "pointer",
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label || (copied ? "Copied!" : "Copy")}
    </button>
  )
}

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label
      style={{
        fontSize: "14px",
        fontWeight: "600",
        color: c.earth600,
        fontFamily: fonts.body,
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        border: `1px solid ${c.earth300}`,
        fontSize: "14px",
        fontFamily: fonts.body,
        backgroundColor: c.card,
        color: c.earth700,
        outline: "none",
      }}
    />
  </div>
)

const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label
      style={{
        fontSize: "14px",
        fontWeight: "600",
        color: c.earth600,
        fontFamily: fonts.body,
      }}
    >
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        border: `1px solid ${c.earth300}`,
        fontSize: "14px",
        fontFamily: fonts.body,
        backgroundColor: c.card,
        color: c.earth700,
        resize: "vertical",
        outline: "none",
      }}
    />
  </div>
)

// Card with gradient top border
const cardStyle = {
  backgroundColor: c.card,
  borderRadius: "12px",
  border: `1px solid ${c.subtle}`,
  borderTop: "4px solid transparent",
  borderImage: c.gradient,
  borderImageSlice: 1,
  overflow: "hidden",
  boxShadow: c.shadow,
} as React.CSSProperties

// ---------------------------------------------------------------------------
// BookingsTable
// ---------------------------------------------------------------------------

const BookingsTable = ({
  bookings,
  onViewBooking,
}: {
  bookings: BookingRow[]
  onViewBooking: (id: string) => void
}) => {
  const now = new Date()
  const upcoming = [...bookings]
    .filter((b) => new Date(b.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const past = [...bookings]
    .filter((b) => new Date(b.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const theadRow = (
    <tr>
      {["Date/Time", "Customer", "Type", "Duration", "Status", "Meeting Link", "Actions"].map(
        (h) => (
          <th
            key={h}
            style={{
              padding: "12px",
              textAlign: "left",
              fontSize: "13px",
              fontWeight: "700",
              color: c.earth600,
            }}
          >
            {h}
          </th>
        )
      )}
    </tr>
  )

  const renderRow = (booking: BookingRow) => (
    <tr key={booking.id} style={{ borderBottom: `1px solid ${c.subtle}` }}>
      <td style={{ padding: "16px 12px" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: c.earth700 }}>
          {formatDate(booking.date)}
        </div>
        <div style={{ fontSize: "13px", color: c.earth400, marginTop: "2px" }}>
          {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: c.earth700 }}>
          {booking.customerName}
        </div>
        <div style={{ fontSize: "13px", color: c.earth400, marginTop: "2px" }}>
          {booking.customerEmail}
        </div>
      </td>
      <td style={{ padding: "16px 12px" }}>
        <TypeBadge type={booking.consultationType} />
      </td>
      <td style={{ padding: "16px 12px", fontSize: "14px", color: c.earth600 }}>
        {booking.duration} min
      </td>
      <td style={{ padding: "16px 12px" }}>
        <StatusBadge status={booking.status} />
      </td>
      <td style={{ padding: "16px 12px" }}>
        {booking.meetingLink ? (
          <CopyButton text={booking.meetingLink} />
        ) : (
          <span style={{ fontSize: "13px", color: c.earth300 }}>—</span>
        )}
      </td>
      <td style={{ padding: "16px 12px" }}>
        <button
          onClick={() => onViewBooking(booking.id)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            color: c.primary500,
            backgroundColor: c.primary50,
            border: `1px solid ${c.primary200}`,
            cursor: "pointer",
          }}
        >
          <Eye size={14} />
          View
        </button>
      </td>
    </tr>
  )

  if (bookings.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: c.earth400,
          fontSize: "14px",
        }}
      >
        No bookings found
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {upcoming.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "12px",
            }}
          >
            Upcoming
          </h3>
          <div style={cardStyle}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: c.subtle }}>{theadRow}</thead>
              <tbody>{upcoming.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "12px",
            }}
          >
            Past
          </h3>
          <div style={cardStyle}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: c.subtle }}>{theadRow}</thead>
              <tbody>{past.map(renderRow)}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// CalendarView
// ---------------------------------------------------------------------------

const CalendarView = ({
  calendarDays,
  selectedDate,
  onSelectDate,
}: {
  calendarDays: CalendarDay[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthYear = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth)

  const goToPrev = () =>
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  const goToNext = () =>
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const calendarGrid: (CalendarDay | null)[] = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarGrid.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const dayData = calendarDays.find((d) => d.date === dateStr)
    calendarGrid.push(
      dayData || { date: dateStr, bookingCount: 0, isBlocked: false, isToday: false }
    )
  }

  return (
    <div
      style={{
        ...cardStyle,
        overflow: "visible",
        padding: "24px",
      }}
    >
      {/* Month nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={goToPrev}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: `1px solid ${c.earth300}`,
            backgroundColor: c.card,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={20} color={c.earth600} />
        </button>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: c.earth700,
            fontFamily: fonts.heading,
          }}
        >
          {monthYear}
        </h3>
        <button
          onClick={goToNext}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: `1px solid ${c.earth300}`,
            backgroundColor: c.card,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronRight size={20} color={c.earth600} />
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
        }}
      >
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: "12px",
              fontWeight: "700",
              color: c.earth500,
              padding: "8px 0",
            }}
          >
            {d}
          </div>
        ))}
        {calendarGrid.map((day, idx) => {
          if (!day)
            return <div key={`empty-${idx}`} />
          const isSelected = selectedDate === day.date
          return (
            <button
              key={day.date}
              onClick={() => !day.isBlocked && onSelectDate(day.date)}
              disabled={day.isBlocked}
              style={{
                padding: "12px 8px",
                borderRadius: "8px",
                border: day.isToday
                  ? `2px solid ${c.primary400}`
                  : `1px solid ${c.earth300}`,
                backgroundColor: isSelected
                  ? c.primary50
                  : day.isBlocked
                  ? c.subtle
                  : c.card,
                cursor: day.isBlocked ? "not-allowed" : "pointer",
                position: "relative",
                textAlign: "center",
                opacity: day.isBlocked ? 0.5 : 1,
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: c.earth700,
                }}
              >
                {new Date(day.date + "T12:00:00").getDate()}
              </div>
              {day.bookingCount > 0 && (
                <div
                  style={{
                    marginTop: "4px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: c.card,
                    backgroundColor: c.primary500,
                    borderRadius: "10px",
                    padding: "2px 6px",
                    display: "inline-block",
                  }}
                >
                  {day.bookingCount}
                </div>
              )}
              {day.isBlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    color: c.error,
                    fontWeight: "300",
                  }}
                >
                  /
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BookingDetailView
// ---------------------------------------------------------------------------

const BookingDetailView = ({
  booking,
  onBack,
  onUpdateStatus,
  onSetMeetingLink,
  onAddNotes,
  onSendEmail,
}: {
  booking: BookingRow
  onBack: () => void
  onUpdateStatus: (id: string, status: BookingStatus) => void
  onSetMeetingLink: (id: string, link: string) => void
  onAddNotes: (id: string, notes: string) => void
  onSendEmail: (id: string, type: "confirmation" | "reminder") => void
}) => {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(
    booking.status
  )
  const [meetingLinkInput, setMeetingLinkInput] = useState(
    booking.meetingLink || ""
  )
  const [notesInput, setNotesInput] = useState(booking.notes || "")

  // Sync local state when booking prop updates (after parent re-fetches)
  useEffect(() => {
    setSelectedStatus(booking.status)
  }, [booking.status])

  useEffect(() => {
    setMeetingLinkInput(booking.meetingLink || "")
  }, [booking.meetingLink])

  useEffect(() => {
    setNotesInput(booking.notes || "")
  }, [booking.notes])

  const detailCardStyle: React.CSSProperties = {
    backgroundColor: c.card,
    borderRadius: "12px",
    border: `1px solid ${c.subtle}`,
    borderTop: "4px solid transparent",
    borderImage: c.gradient,
    borderImageSlice: 1,
    padding: "32px",
    boxShadow: c.shadow,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  }

  const divider = (
    <div style={{ height: "1px", backgroundColor: c.subtle }} />
  )

  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <h3
      style={{
        fontSize: "16px",
        fontWeight: "700",
        color: c.earth700,
        fontFamily: fonts.heading,
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {icon}
      {title}
    </h3>
  )

  return (
    <div>
      {/* Back */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: `1px solid ${c.earth300}`,
            backgroundColor: c.card,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={20} color={c.earth600} />
        </button>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: c.earth700,
            fontFamily: fonts.heading,
          }}
        >
          Booking #{booking.id.slice(0, 8)}
        </h2>
      </div>

      <div style={detailCardStyle}>
        {/* Customer Info */}
        <div>
          {sectionTitle(<User size={18} color={c.primary500} />, "Customer Information")}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: c.earth400,
                  marginBottom: "4px",
                }}
              >
                Name
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: c.earth700,
                }}
              >
                {booking.customerName}
              </div>
            </div>
            {booking.customerEmail && (
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: c.earth400,
                    marginBottom: "4px",
                  }}
                >
                  Email
                </div>
                <a
                  href={`mailto:${booking.customerEmail}`}
                  style={{
                    fontSize: "14px",
                    color: c.primary500,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {booking.customerEmail}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            {booking.customerPhone && (
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: c.earth400,
                    marginBottom: "4px",
                  }}
                >
                  Phone
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: c.earth700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Phone size={14} color={c.earth500} />
                  {booking.customerPhone}
                </div>
              </div>
            )}
          </div>
        </div>

        {divider}

        {/* Booking Details */}
        <div>
          {sectionTitle(
            <Clock size={18} color={c.primary500} />,
            "Consultation Details"
          )}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <TypeBadge type={booking.consultationType} />
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: c.earth400,
                  marginBottom: "4px",
                }}
              >
                Date &amp; Time
              </div>
              <div style={{ fontSize: "14px", color: c.earth700 }}>
                {formatDateTime(booking.date, booking.startTime)}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: c.earth500,
                  marginTop: "2px",
                }}
              >
                Duration: {booking.duration} minutes
              </div>
            </div>
          </div>
        </div>

        {divider}

        {/* Status */}
        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "16px",
            }}
          >
            Status
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <StatusBadge status={booking.status} />
            <ThemeSelect
              value={selectedStatus}
              onChange={(v) => setSelectedStatus(v as BookingStatus)}
              options={[
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <button
              onClick={() => onUpdateStatus(booking.id, selectedStatus)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: c.card,
                backgroundColor: c.primary500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Update Status
            </button>
          </div>
        </div>

        {divider}

        {/* Meeting Link */}
        <div>
          {sectionTitle(
            <Video size={18} color={c.primary500} />,
            "Meeting Link"
          )}
          {booking.meetingLink ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "8px",
                  backgroundColor: c.subtle,
                  fontSize: "14px",
                  color: c.earth700,
                  fontFamily: fonts.mono,
                  wordBreak: "break-all",
                }}
              >
                {booking.meetingLink}
              </div>
              <CopyButton text={booking.meetingLink} />
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <InputField
                label="Paste or type a meeting link"
                value={meetingLinkInput}
                onChange={setMeetingLinkInput}
                placeholder="https://meet.google.com/..."
              />
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() =>
                    onSetMeetingLink(booking.id, meetingLinkInput)
                  }
                  disabled={!meetingLinkInput.trim()}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: c.card,
                    backgroundColor: c.primary500,
                    border: "none",
                    cursor: meetingLinkInput.trim() ? "pointer" : "not-allowed",
                    opacity: meetingLinkInput.trim() ? 1 : 0.5,
                  }}
                >
                  Save Link
                </button>
                <button
                  onClick={() => {
                    const code = Math.random().toString(36).substring(2, 5)
                    const rand = Math.random().toString(36).substring(2, 6)
                    setMeetingLinkInput(
                      `https://meet.google.com/${code}-${rand}-${code}`
                    )
                  }}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: c.primary500,
                    backgroundColor: c.primary50,
                    border: `1px solid ${c.primary200}`,
                    cursor: "pointer",
                  }}
                >
                  Auto-generate
                </button>
              </div>
            </div>
          )}
        </div>

        {divider}

        {/* Notes */}
        <div>
          {sectionTitle(
            <FileText size={18} color={c.primary500} />,
            "Notes"
          )}
          {booking.notes && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                backgroundColor: c.subtle,
                fontSize: "14px",
                color: c.earth700,
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              {booking.notes}
            </div>
          )}
          <TextArea
            label={booking.notes ? "Update Notes" : "Add Notes"}
            value={notesInput}
            onChange={setNotesInput}
            placeholder="Add notes about this booking..."
          />
          <button
            onClick={() => onAddNotes(booking.id, notesInput)}
            style={{
              marginTop: "12px",
              padding: "10px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: c.card,
              backgroundColor: c.primary500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Save Notes
          </button>
        </div>

        {divider}

        {/* Email Actions */}
        <div>
          {sectionTitle(
            <Mail size={18} color={c.primary500} />,
            "Email Actions"
          )}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => onSendEmail(booking.id, "confirmation")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: c.card,
                backgroundColor: c.secondary500,
                border: "none",
                cursor: "pointer",
              }}
            >
              <Mail size={16} />
              Send Confirmation
            </button>
            <button
              onClick={() => onSendEmail(booking.id, "reminder")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: c.secondary500,
                backgroundColor: c.secondary50,
                border: `1px solid ${c.secondary300}`,
                cursor: "pointer",
              }}
            >
              <Mail size={16} />
              Send Reminder
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SettingsView
// ---------------------------------------------------------------------------

const SettingsView = ({
  slotConfig,
  blockedDates,
  onBack,
  onUpdateSlotConfig,
  onBlockDate,
  onUnblockDate,
}: {
  slotConfig: TimeSlotConfig
  blockedDates: BlockedDate[]
  onBack: () => void
  onUpdateSlotConfig: (config: TimeSlotConfig) => void
  onBlockDate: (date: string, reason: string) => void
  onUnblockDate: (id: string) => void
}) => {
  const [config, setConfig] = useState<TimeSlotConfig>(slotConfig)
  const [newBlockedDate, setNewBlockedDate] = useState("")
  const [newBlockedReason, setNewBlockedReason] = useState("")

  // Sync if parent updates slot config
  useEffect(() => {
    setConfig(slotConfig)
  }, [slotConfig])

  const toggleDay = (day: DayOfWeek) => {
    const enabled = config.enabledDays.includes(day)
    setConfig({
      ...config,
      enabledDays: enabled
        ? config.enabledDays.filter((d) => d !== day)
        : [...config.enabledDays, day],
    })
  }

  const sectionCardStyle: React.CSSProperties = {
    backgroundColor: c.card,
    borderRadius: "12px",
    border: `1px solid ${c.subtle}`,
    borderTop: "4px solid transparent",
    borderImage: c.gradient,
    borderImageSlice: 1,
    padding: "24px",
    boxShadow: c.shadow,
  }

  return (
    <div>
      {/* Back */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: `1px solid ${c.earth300}`,
            backgroundColor: c.card,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ChevronLeft size={20} color={c.earth600} />
        </button>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: c.earth700,
            fontFamily: fonts.heading,
          }}
        >
          Booking Settings
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Time Slot Configuration */}
        <div style={sectionCardStyle}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "20px",
            }}
          >
            Time Slot Configuration
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {/* Days */}
            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: c.earth600,
                  marginBottom: "12px",
                  display: "block",
                }}
              >
                Available Days
              </label>
              <div
                style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
              >
                {(Object.keys(dayLabels) as DayOfWeek[]).map((day) => (
                  <label
                    key={day}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: `1px solid ${
                        config.enabledDays.includes(day)
                          ? c.primary400
                          : c.earth300
                      }`,
                      backgroundColor: config.enabledDays.includes(day)
                        ? c.primary50
                        : c.card,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={config.enabledDays.includes(day)}
                      onChange={() => toggleDay(day)}
                      style={{ cursor: "pointer" }}
                    />
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: c.earth700,
                      }}
                    >
                      {dayLabels[day]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <InputField
                label="Start Time"
                type="time"
                value={config.startTime}
                onChange={(v) => setConfig({ ...config, startTime: v })}
              />
              <InputField
                label="End Time"
                type="time"
                value={config.endTime}
                onChange={(v) => setConfig({ ...config, endTime: v })}
              />
            </div>

            {/* Slot Duration */}
            <div>
              <label
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: c.earth600,
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Slot Duration
              </label>
              <ThemeSelect
                value={String(config.slotDuration)}
                onChange={(v) =>
                  setConfig({
                    ...config,
                    slotDuration: parseInt(v) as 30 | 45 | 60,
                  })
                }
                options={[
                  { value: "30", label: "30 minutes" },
                  { value: "45", label: "45 minutes" },
                  { value: "60", label: "60 minutes" },
                ]}
              />
            </div>

            {/* Buffer & Max Bookings */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <InputField
                label="Buffer Between Slots (minutes)"
                type="number"
                value={String(config.bufferMinutes)}
                onChange={(v) =>
                  setConfig({ ...config, bufferMinutes: parseInt(v) || 0 })
                }
              />
              <InputField
                label="Max Bookings Per Day"
                type="number"
                value={String(config.maxBookingsPerDay)}
                onChange={(v) =>
                  setConfig({
                    ...config,
                    maxBookingsPerDay: parseInt(v) || 1,
                  })
                }
              />
            </div>

            <button
              onClick={() => onUpdateSlotConfig(config)}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: c.card,
                backgroundColor: c.primary500,
                border: "none",
                cursor: "pointer",
                alignSelf: "flex-start",
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Blocked Dates */}
        <div style={sectionCardStyle}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "20px",
            }}
          >
            Blocked Dates
          </h3>

          {blockedDates.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {blockedDates.map((blocked) => (
                  <div
                    key={blocked.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: c.errorLight,
                      border: `1px solid ${c.error}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: c.earth700,
                        }}
                      >
                        {formatDate(blocked.date)}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: c.earth500,
                          marginTop: "2px",
                        }}
                      >
                        {blocked.reason}
                      </div>
                    </div>
                    <button
                      onClick={() => onUnblockDate(blocked.id)}
                      style={{
                        padding: "6px",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: c.error,
                        color: c.card,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <InputField
              label="Date to Block"
              type="date"
              value={newBlockedDate}
              onChange={setNewBlockedDate}
            />
            <InputField
              label="Reason"
              value={newBlockedReason}
              onChange={setNewBlockedReason}
              placeholder="e.g., Holiday, Personal time off"
            />
            <button
              onClick={() => {
                if (newBlockedDate && newBlockedReason) {
                  onBlockDate(newBlockedDate, newBlockedReason)
                  setNewBlockedDate("")
                  setNewBlockedReason("")
                }
              }}
              disabled={!newBlockedDate || !newBlockedReason}
              style={{
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                color: c.card,
                backgroundColor: c.error,
                border: "none",
                cursor:
                  newBlockedDate && newBlockedReason
                    ? "pointer"
                    : "not-allowed",
                opacity: newBlockedDate && newBlockedReason ? 1 : 0.5,
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} />
              Block Date
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AdminBookings({
  bookings,
  calendarDays,
  slotConfig,
  blockedDates,
  selectedDate,
  viewMode,
  isLoading = false,
  onChangeViewMode = () => {},
  onSelectDate = () => {},
  onViewBooking = () => {},
  onUpdateStatus = () => {},
  onSetMeetingLink = () => {},
  onAddNotes = () => {},
  onSendEmail = () => {},
  onUpdateSlotConfig = () => {},
  onBlockDate = () => {},
  onUnblockDate = () => {},
}: AdminBookingsProps) {
  const [view, setView] = useState<ViewState>("main")
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  const handleViewBooking = (id: string) => {
    setSelectedBookingId(id)
    setView("booking-detail")
    onViewBooking(id)
  }

  const selectedBooking = selectedBookingId
    ? bookings.find((b) => b.id === selectedBookingId)
    : null

  const filteredBookings = selectedDate
    ? bookings.filter((b) => b.date === selectedDate)
    : bookings

  const now = new Date()
  const today = now.toISOString().split("T")[0]
  const upcomingCount = bookings.filter((b) => b.date >= today).length
  const todayCount = bookings.filter((b) => b.date === today).length
  const pendingCount = bookings.filter((b) => b.status === "pending").length

  if (view === "booking-detail" && selectedBooking) {
    return (
      <BookingDetailView
        booking={selectedBooking}
        onBack={() => setView("main")}
        onUpdateStatus={onUpdateStatus}
        onSetMeetingLink={onSetMeetingLink}
        onAddNotes={onAddNotes}
        onSendEmail={onSendEmail}
      />
    )
  }

  if (view === "settings") {
    return (
      <SettingsView
        slotConfig={slotConfig}
        blockedDates={blockedDates}
        onBack={() => setView("main")}
        onUpdateSlotConfig={onUpdateSlotConfig}
        onBlockDate={onBlockDate}
        onUnblockDate={onUnblockDate}
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: c.earth700,
              fontFamily: fonts.heading,
              marginBottom: "8px",
            }}
          >
            Bookings &amp; Consultations
          </h1>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "13px",
                padding: "4px 10px",
                borderRadius: "10px",
                backgroundColor: c.primary50,
                color: c.primary500,
                fontWeight: "600",
              }}
            >
              {upcomingCount} Upcoming
            </span>
            <span
              style={{
                fontSize: "13px",
                padding: "4px 10px",
                borderRadius: "10px",
                backgroundColor: c.successLight,
                color: c.success,
                fontWeight: "600",
              }}
            >
              {todayCount} Today
            </span>
            <span
              style={{
                fontSize: "13px",
                padding: "4px 10px",
                borderRadius: "10px",
                backgroundColor: c.warningLight,
                color: c.warning,
                fontWeight: "600",
              }}
            >
              {pendingCount} Pending
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* View mode toggle */}
          <div
            style={{
              display: "flex",
              borderRadius: "8px",
              overflow: "hidden",
              border: `1px solid ${c.earth300}`,
            }}
          >
            {(["calendar", "list"] as BookingsViewMode[]).map((mode, idx) => (
              <button
                key={mode}
                onClick={() => onChangeViewMode(mode)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: viewMode === mode ? c.card : c.earth600,
                  backgroundColor:
                    viewMode === mode ? c.primary500 : c.card,
                  border: "none",
                  borderLeft: idx > 0 ? `1px solid ${c.earth300}` : "none",
                  cursor: "pointer",
                }}
              >
                {mode === "calendar" ? (
                  <Calendar size={16} />
                ) : (
                  <List size={16} />
                )}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Settings */}
          <button
            onClick={() => setView("settings")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: c.earth600,
              backgroundColor: c.card,
              border: `1px solid ${c.earth300}`,
              cursor: "pointer",
            }}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            color: c.earth400,
            fontSize: "14px",
          }}
        >
          Loading bookings…
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {viewMode === "calendar" && (
            <>
              <CalendarView
                calendarDays={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={onSelectDate}
              />
              {selectedDate && (
                <div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: c.earth700,
                      fontFamily: fonts.heading,
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    Bookings for {formatDate(selectedDate)}
                    {filteredBookings.length > 0 && (
                      <span
                        style={{
                          fontSize: "14px",
                          padding: "4px 10px",
                          borderRadius: "10px",
                          backgroundColor: c.primary50,
                          color: c.primary500,
                          fontWeight: "600",
                        }}
                      >
                        {filteredBookings.length}
                      </span>
                    )}
                  </h3>
                  <BookingsTable
                    bookings={filteredBookings}
                    onViewBooking={handleViewBooking}
                  />
                </div>
              )}
            </>
          )}

          {viewMode === "list" && (
            <BookingsTable
              bookings={filteredBookings}
              onViewBooking={handleViewBooking}
            />
          )}
        </div>
      )}
    </div>
  )
}
