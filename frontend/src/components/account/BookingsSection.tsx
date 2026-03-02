"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Video, Loader2, Plus, X } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { Booking, BookingServiceType } from "@/types/dashboard"

const STATUS_CONFIG = {
  pending: { label: "Pending Confirmation", color: "#F59E0B", bg: "#FFFBEB" },
  confirmed: { label: "Confirmed", color: "#10B981", bg: "#ECFDF5" },
  completed: { label: "Completed", color: "#6B7280", bg: "#F3F4F6" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
}

const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]

// All consultations are India-based — use IST (UTC+5:30) for all time comparisons
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function getISTDate(): Date {
  return new Date(Date.now() + IST_OFFSET_MS)
}

function toISTDateStr(): string {
  const d = getISTDate()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
}

function parseSlotHour(slot: string): number {
  const [time, period] = slot.split(" ")
  let [hour] = time.split(":").map(Number)
  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0
  return hour
}

function getAvailableSlots(selectedDate: string): string[] {
  if (!selectedDate) return TIME_SLOTS
  const todayIST = toISTDateStr()
  if (selectedDate !== todayIST) return TIME_SLOTS
  const ist = getISTDate()
  const currentHour = ist.getUTCHours()
  const currentMinute = ist.getUTCMinutes()
  // Require at least 1 hour ahead (in IST)
  return TIME_SLOTS.filter((slot) => {
    const slotHour = parseSlotHour(slot)
    return slotHour * 60 > currentHour * 60 + currentMinute + 60
  })
}

interface BookingFormData {
  serviceTypeId: string
  date: string
  time: string
  notes: string
}

export function BookingsSection() {
  const { fetchBookings, createBooking, fetchBookingServiceTypes } = useDashboardData()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [serviceTypes, setServiceTypes] = useState<BookingServiceType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BookingFormData>({ serviceTypeId: "", date: "", time: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Read URL param client-side (safe — this is a "use client" component)
    const urlParams = new URLSearchParams(window.location.search)
    const typeFromUrl = urlParams.get("type")

    Promise.all([fetchBookings(), fetchBookingServiceTypes()]).then(([b, types]) => {
      setBookings(b)
      setServiceTypes(types)

      // Auto-select service type from URL param, or if only one exists
      const autoId = typeFromUrl && types.find((t) => t.id === typeFromUrl)
        ? typeFromUrl
        : types.length === 1
        ? types[0].id
        : ""

      if (autoId) {
        setForm((prev) => ({ ...prev, serviceTypeId: autoId }))
        setShowForm(true)
      }

      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const availableSlots = getAvailableSlots(form.date)

  const handleBook = async () => {
    if (!form.serviceTypeId || !form.date || !form.time) {
      setError("Please fill in all required fields")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const selectedType = serviceTypes.find((t) => t.id === form.serviceTypeId)
      const newBooking = await createBooking({
        title: selectedType?.title || form.serviceTypeId,
        consultant_name: selectedType?.title || "",
        date: form.date,
        time: form.time,
        notes: form.notes,
        price: selectedType?.price || 0,
        currency: selectedType?.currency || "INR",
      })
      setBookings((prev) => [newBooking, ...prev])
      setShowForm(false)
      setForm({ serviceTypeId: "", date: "", time: "", notes: "" })
    } catch (err: any) {
      setError(err?.message || "Failed to create booking")
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
    } catch {
      return d
    }
  }

  const minDateStr = toISTDateStr()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
            My Bookings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
            Vastu & spiritual consultations
          </p>
        </div>
        {serviceTypes.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary[500] }}
          >
            <Plus className="w-4 h-4" />
            Book Now
          </button>
        )}
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: bg.card, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #f0ebe4" }}>
              <h2 className="text-base font-semibold" style={{ color: earth[700], fontFamily: fonts.heading }}>
                Book a Consultation
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:opacity-70" style={{ color: earth[400] }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Consultation type */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: earth[600] }}>
                  Consultation Type *
                </label>
                <div className="space-y-2">
                  {serviceTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, serviceTypeId: type.id }))}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1.5px solid ${form.serviceTypeId === type.id ? primary[500] : "#e8e0d8"}`,
                        background: form.serviceTypeId === type.id ? `${primary[50]}` : bg.card,
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: earth[700] }}>{type.title}</p>
                        {type.description && (
                          <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{type.description}</p>
                        )}
                        {type.duration_minutes > 0 && (
                          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: earth[300] }}>
                            <Clock className="w-3 h-3" />
                            {type.duration_minutes} min
                          </p>
                        )}
                      </div>
                      {type.price > 0 && (
                        <p className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: primary[500] }}>
                          ₹{type.price.toLocaleString("en-IN")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
                  Preferred Date *
                </label>
                <input
                  type="date"
                  min={minDateStr}
                  value={form.date}
                  onChange={(e) => {
                    const newDate = e.target.value
                    const available = getAvailableSlots(newDate)
                    setForm((prev) => ({
                      ...prev,
                      date: newDate,
                      // Clear time if the previously selected slot is no longer available
                      time: available.includes(prev.time) ? prev.time : "",
                    }))
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ border: "1.5px solid #e8e0d8", color: earth[700], fontFamily: fonts.body, background: bg.card }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
                />
              </div>

              {/* Time slot */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: earth[600] }}>
                  Preferred Time *
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ color: earth[400], background: "#f9f6f2" }}>
                    No slots available for today — please select a future date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, time: slot }))}
                        className="py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: form.time === slot ? primary[500] : "#f0ebe4",
                          color: form.time === slot ? "#fff" : earth[600],
                        }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any specific concerns or questions..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ border: "1.5px solid #e8e0d8", color: earth[700], fontFamily: fonts.body, background: bg.card }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
                />
              </div>

              {error && <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#EF4444", background: "#FEF2F2" }}>{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBook}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: primary[500] }}
                >
                  {saving ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto" style={{ color: primary[500] }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center rounded-2xl" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: earth[200] }} />
          <p className="text-sm font-medium" style={{ color: earth[500] }}>No bookings yet</p>
          <p className="text-xs mt-1 mb-4" style={{ color: earth[300] }}>
            {serviceTypes.length > 0
              ? "Book a Vastu consultation with our experts"
              : "No consultation services are currently available"}
          </p>
          {serviceTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: primary[500] }}
            >
              Book a Consultation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending
            return (
              <div key={booking.id} className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: earth[700] }}>{booking.title}</p>
                    {booking.consultant_name && (
                      <p className="text-xs mt-0.5" style={{ color: earth[400] }}>with {booking.consultant_name}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0" style={{ background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: primary[400] }} />
                    <span className="text-xs" style={{ color: earth[600] }}>{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" style={{ color: primary[400] }} />
                    <span className="text-xs" style={{ color: earth[600] }}>{booking.time}</span>
                  </div>
                  {booking.price > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold" style={{ color: primary[500] }}>
                        ₹{booking.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                {booking.meeting_link && booking.status === "confirmed" && (
                  <a
                    href={booking.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white w-fit"
                    style={{ background: "#10B981" }}
                  >
                    <Video className="w-4 h-4" />
                    Join Meeting
                  </a>
                )}

                {booking.notes && (
                  <p className="mt-2 text-xs px-3 py-2 rounded-lg" style={{ background: "#f9f6f2", color: earth[500] }}>
                    {booking.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
