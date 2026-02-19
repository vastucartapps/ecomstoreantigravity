"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Video, Phone, CheckCircle2, XCircle, Loader2, Plus, X } from "lucide-react"
import { useDashboardData } from "@/hooks/useDashboardData"
import { primary, earth, bg, fonts } from "@/lib/theme"
import type { Booking } from "@/types/dashboard"

const STATUS_CONFIG = {
  pending: { label: "Pending Confirmation", color: "#F59E0B", bg: "#FFFBEB" },
  confirmed: { label: "Confirmed", color: "#10B981", bg: "#ECFDF5" },
  completed: { label: "Completed", color: "#6B7280", bg: "#F3F4F6" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "#FEF2F2" },
}

const CONSULTATION_TYPES = [
  { id: "vastu_home", title: "Home Vastu Consultation", price: 1999, description: "Complete home energy analysis" },
  { id: "vastu_office", title: "Office Vastu Consultation", price: 2999, description: "Workplace prosperity analysis" },
  { id: "crystal_healing", title: "Crystal Healing Session", price: 999, description: "Personal crystal prescription" },
  { id: "numerology", title: "Numerology Reading", price: 699, description: "Life path & destiny analysis" },
]

const TIME_SLOTS = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"]

interface BookingFormData {
  consultationType: string
  date: string
  time: string
  notes: string
}

export function BookingsSection() {
  const { fetchBookings, createBooking } = useDashboardData()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BookingFormData>({ consultationType: "", date: "", time: "", notes: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings().then((b) => {
      setBookings(b)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const handleBook = async () => {
    if (!form.consultationType || !form.date || !form.time) {
      setError("Please fill in all required fields")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const selectedType = CONSULTATION_TYPES.find((t) => t.id === form.consultationType)
      const newBooking = await createBooking({
        title: selectedType?.title || form.consultationType,
        consultant_name: selectedType?.title || "",
        date: form.date,
        time: form.time,
        notes: form.notes,
        price: selectedType?.price || 0,
        currency: "INR",
      })
      setBookings((prev) => [newBooking, ...prev])
      setShowForm(false)
      setForm({ consultationType: "", date: "", time: "", notes: "" })
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

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split("T")[0]

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
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: primary[500] }}
        >
          <Plus className="w-4 h-4" />
          Book Now
        </button>
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
                  {CONSULTATION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setForm({ ...form, consultationType: type.id })}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-left transition-all"
                      style={{
                        border: `1.5px solid ${form.consultationType === type.id ? primary[500] : "#e8e0d8"}`,
                        background: form.consultationType === type.id ? `${primary[50]}` : bg.card,
                      }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: earth[700] }}>{type.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{type.description}</p>
                      </div>
                      <p className="text-sm font-bold flex-shrink-0 ml-3" style={{ color: primary[500] }}>
                        ₹{type.price}
                      </p>
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
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
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
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setForm({ ...form, time: slot })}
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
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: earth[600] }}>
                  Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ border: "1.5px solid #e8e0d8", color: earth[600] }}>
                  Cancel
                </button>
                <button onClick={handleBook} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50" style={{ background: primary[500] }}>
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
            Book a Vastu consultation with our experts
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: primary[500] }}
          >
            Book a Consultation
          </button>
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
