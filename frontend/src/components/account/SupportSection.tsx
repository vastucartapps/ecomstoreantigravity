"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Mail,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Package,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { primary, earth, bg, fonts } from "@/lib/theme"
import { useAuth } from "@/providers/auth-provider"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ""
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const CATEGORIES = [
  "Order Issue",
  "Payment Issue",
  "Return / Refund",
  "Product Query",
  "Delivery Delay",
  "Gift Card",
  "Account Issue",
  "Other",
]

const FAQ_ITEMS = [
  {
    q: "How do I track my order?",
    a: "Go to My Orders → click on any order to see the full tracking timeline. You'll also receive email updates at each stage.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for eligible items in original packaging with an uncut unboxing video. See our Return Policy for complete details.",
  },
  {
    q: "How are loyalty points earned?",
    a: "You earn 1 loyalty point for every ₹100 spent (prepaid orders only). Points are credited within 24 hours of order confirmation.",
  },
  {
    q: "How do I use a gift card at checkout?",
    a: "Enter your gift card code in the payment section at checkout. The balance is automatically deducted. Any remaining balance stays on the card.",
  },
  {
    q: "Can I change my delivery address after placing an order?",
    a: "Address changes are possible only before the order is shipped. Contact us immediately via WhatsApp or the form below.",
  },
  {
    q: "How long does delivery take?",
    a: "India orders: 4–7 business days. International: 10–20 business days. Express options may be available at checkout.",
  },
]

interface Ticket {
  id: string
  category: string
  message: string
  status: "open" | "closed"
  admin_reply?: string
  admin_reply_at?: string
  admin_reply_by?: string
  created_at: string
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const isOpen = ticket.status === "open"

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1.5px solid ${isOpen ? "#FDE68A" : "#e8e0d8"}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: isOpen ? "#FFFBEB" : "#fafafa" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: isOpen ? "#FDE68A" : "#D1FAE5",
              color: isOpen ? "#78350F" : "#065F46",
            }}
          >
            {isOpen ? "Open" : "Resolved"}
          </span>
          <span className="text-sm font-semibold" style={{ color: earth[700] }}>
            {ticket.category}
          </span>
        </div>
        <span className="text-xs" style={{ color: earth[300] }}>
          {new Date(ticket.created_at).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Message */}
      <div className="px-4 py-3" style={{ background: bg.card }}>
        <p className="text-sm" style={{ color: earth[600] }}>{ticket.message}</p>
      </div>

      {/* Admin reply */}
      {ticket.admin_reply && (
        <div className="px-4 py-3" style={{ background: "#ECFDF5", borderTop: "1px solid #D1FAE5" }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#10B981" }} />
            <span className="text-xs font-semibold" style={{ color: "#065F46" }}>
              {ticket.admin_reply_by || "VastuCart Support"} replied
              {ticket.admin_reply_at
                ? ` · ${new Date(ticket.admin_reply_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`
                : ""}
            </span>
          </div>
          <p className="text-sm" style={{ color: "#065F46" }}>{ticket.admin_reply}</p>
        </div>
      )}

      {/* Open ticket notice */}
      {isOpen && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "#FFFBEB", borderTop: "1px solid #FDE68A" }}>
          <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#D97706" }} />
          <span className="text-xs" style={{ color: "#92400E" }}>
            We'll get back to you within 24 hours
          </span>
        </div>
      )}
    </div>
  )
}

export function SupportSection() {
  const { user } = useAuth()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)

  // Ticket form
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/store/customers/me/support-tickets`, {
        headers: { "x-publishable-api-key": PUB_KEY },
        credentials: "include",
      })
      if (!res.ok) return
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch {
      // fail silently — tickets are not critical to page render
    } finally {
      setTicketsLoading(false)
    }
  }, [])

  // Initial load + 30-second real-time polling
  useEffect(() => {
    loadTickets()
    const interval = setInterval(loadTickets, 30_000)
    return () => clearInterval(interval)
  }, [loadTickets])

  const handleSubmit = async () => {
    if (!category) { setSubmitError("Please select an issue category"); return }
    if (!message.trim()) { setSubmitError("Please describe your issue"); return }
    if (!user) { setSubmitError("Please log in to submit a ticket"); return }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch(`${BACKEND_URL}/store/customers/me/support-tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PUB_KEY },
        credentials: "include",
        body: JSON.stringify({
          category,
          message: message.trim(),
          customer_email: user.email,
          customer_name: user.name || "Customer",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Failed to submit")

      setSubmitSuccess(true)
      setCategory("")
      setMessage("")
      // Add new ticket to list immediately (optimistic)
      setTickets((prev) => [data.ticket, ...prev])
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const openTickets = tickets.filter((t) => t.status === "open")
  const closedTickets = tickets.filter((t) => t.status === "closed")

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          Help & Support
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          Send us a message — we respond within 24 hours
        </p>
      </div>

      {/* Quick contact cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="mailto:vastucartcare@gmail.com"
          className="flex items-center gap-3 p-4 rounded-2xl transition-shadow hover:shadow-sm"
          style={{ background: "#EFF6FF", border: "1px solid #DBEAFE", textDecoration: "none" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#3B82F620" }}>
            <Mail className="w-5 h-5" style={{ color: "#3B82F6" }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: earth[500] }}>Email Us</p>
            <p className="text-sm font-bold" style={{ color: "#3B82F6" }}>vastucartcare@gmail.com</p>
          </div>
        </a>

        <a
          href="https://wa.me/919461194356"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-2xl transition-shadow hover:shadow-sm"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", textDecoration: "none" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#25D36620" }}>
            <MessageCircle className="w-5 h-5" style={{ color: "#25D366" }} />
          </div>
          <div>
            <p className="text-xs font-semibold" style={{ color: earth[500] }}>WhatsApp</p>
            <p className="text-sm font-bold" style={{ color: "#25D366" }}>+91 94611 94356</p>
          </div>
        </a>
      </div>

      {/* Track order shortcut */}
      <a
        href="/account/orders"
        className="flex items-center gap-3 p-4 rounded-2xl"
        style={{ background: `${primary[50]}`, border: `1px solid ${primary[100]}`, textDecoration: "none" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${primary[500]}20` }}>
          <Package className="w-5 h-5" style={{ color: primary[500] }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: primary[700] }}>Track Your Order</p>
          <p className="text-xs mt-0.5" style={{ color: earth[400] }}>View order status and delivery timeline in My Orders</p>
        </div>
        <ChevronDown className="w-4 h-4 -rotate-90" style={{ color: primary[400] }} />
      </a>

      {/* Submit ticket form */}
      <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: earth[700] }}>
          Submit a Support Request
        </h2>

        {submitSuccess && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ background: "#ECFDF5", border: "1px solid #D1FAE5" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#10B981" }} />
            <span className="text-sm font-medium" style={{ color: "#065F46" }}>
              Ticket submitted! We'll get back to you within 24 hours.
            </span>
          </div>
        )}

        <div className="space-y-3">
          {/* Category */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: earth[500] }}>
              Issue Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
              style={{ border: "1.5px solid #e8e0d8", color: category ? earth[700] : earth[300], background: "#fafafa" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            >
              <option value="">Select issue type…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: earth[500] }}>
              Describe your issue *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide as much detail as possible — order number, product name, what happened…"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ border: "1.5px solid #e8e0d8", color: earth[700], background: "#fafafa", fontFamily: fonts.body }}
              onFocus={(e) => (e.currentTarget.style.borderColor = primary[500])}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#e8e0d8")}
            />
            <p className="text-xs mt-1" style={{ color: earth[300] }}>{message.length}/1000</p>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#EF4444" }} />
              <p className="text-sm" style={{ color: "#B91C1C" }}>{submitError}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !category || !message.trim()}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)`, fontFamily: fonts.body }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? "Submitting…" : "Send Message"}
          </button>

          <p className="text-xs text-center" style={{ color: earth[300] }}>
            Drop your message and we'll get back to you within 24 hours. Each reply closes the ticket — send a new message if you need further help.
          </p>
        </div>
      </div>

      {/* My tickets */}
      {(ticketsLoading || tickets.length > 0) && (
        <div className="rounded-2xl p-5" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: earth[700] }}>My Support Tickets</h2>
            <button
              onClick={loadTickets}
              className="p-1.5 rounded-lg"
              style={{ color: earth[300] }}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {ticketsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: primary[300] }} />
            </div>
          ) : (
            <div className="space-y-3">
              {openTickets.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: earth[300] }}>Open</p>
                  {openTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
                </>
              )}
              {closedTickets.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-3" style={{ color: earth[300] }}>
                    Resolved
                  </p>
                  {closedTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f0ebe4", background: bg.card }}>
          <h2 className="text-sm font-semibold" style={{ color: earth[700] }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ background: bg.card }}>
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              style={{ borderBottom: idx < FAQ_ITEMS.length - 1 ? "1px solid #f0ebe4" : "none" }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                style={{ color: earth[700], background: "transparent", border: "none", cursor: "pointer" }}
              >
                <span className="text-sm font-medium">{item.q}</span>
                {openFaq === idx
                  ? <ChevronUp className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: earth[300] }} />
                  : <ChevronDown className="w-4 h-4 flex-shrink-0 ml-2" style={{ color: earth[300] }} />
                }
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4">
                  <p className="text-sm" style={{ color: earth[500] }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
