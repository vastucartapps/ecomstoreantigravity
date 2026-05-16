"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  RefreshCw,
  User,
  Mail,
  X,
  ChevronDown,
} from "lucide-react"
import { useAdminSupport, type SupportTicket } from "@/hooks/useAdminSupport"
import { useAuth } from "@/providers/auth-provider"
import { primary, earth, bg, fonts } from "@/lib/theme"

const c = {
  primary: primary[500],
  earth700: earth[700],
  earth600: earth[600],
  earth400: earth[400],
  earth300: earth[300],
  card: bg.card,
  subtle: "#f0ebe4",
  success: "#10B981",
  successLight: "#ECFDF5",
  warning: "#D97706",
  warningLight: "#FFFBEB",
}

const CATEGORY_COLORS: Record<string, string> = {
  "Order Issue": "#3B82F6",
  "Payment Issue": "#8B5CF6",
  "Return / Refund": "#EF4444",
  "Product Query": "#F59E0B",
  "Delivery Delay": "#F97316",
  "Gift Card": "#EC4899",
  "Account Issue": "#6B7280",
  "Other": "#64748B",
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function StatusBadge({ status }: { status: string }) {
  const isOpen = status === "open"
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        background: isOpen ? c.warningLight : c.successLight,
        color: isOpen ? c.warning : c.success,
      }}
    >
      {isOpen ? <Clock style={{ width: 12, height: 12 }} /> : <CheckCircle2 style={{ width: 12, height: 12 }} />}
      {isOpen ? "Open" : "Resolved"}
    </span>
  )
}

// ─── Reply Modal ─────────────────────────────────────────────────────────────

interface ReplyModalProps {
  ticket: SupportTicket
  repliedBy: string
  onClose: () => void
  onSend: (id: string, reply: string) => Promise<void>
}

function ReplyModal({ ticket, repliedBy, onClose, onSend }: ReplyModalProps) {
  const [reply, setReply] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSend = async () => {
    if (!reply.trim()) { setError("Reply cannot be empty"); return }
    setSending(true)
    setError(null)
    try {
      await onSend(ticket.id, reply.trim())
      onClose()
    } catch {
      setError("Failed to send reply. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: c.card, borderRadius: "12px",
          width: "100%", maxWidth: "560px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: `1px solid ${c.subtle}`,
          }}
        >
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: c.earth700, fontFamily: fonts.heading, margin: 0 }}>
              Reply to Ticket
            </h3>
            <p style={{ fontSize: "12px", color: c.earth400, margin: "2px 0 0" }}>
              {ticket.customer_name} · {ticket.category}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: c.earth400 }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Customer message */}
          <div
            style={{
              padding: "12px 14px", borderRadius: "8px", marginBottom: "16px",
              background: "#fafafa", border: `1px solid ${c.subtle}`,
            }}
          >
            <p style={{ fontSize: "11px", fontWeight: 600, color: c.earth400, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Customer's message
            </p>
            <p style={{ fontSize: "14px", color: c.earth600, margin: 0 }}>{ticket.message}</p>
          </div>

          {/* Reply textarea */}
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: 500, color: c.earth600, display: "block", marginBottom: "6px" }}>
              Your Reply
            </label>
            <textarea
              ref={textareaRef}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your reply here…"
              rows={5}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: `1.5px solid ${c.subtle}`, fontSize: "14px", color: c.earth700,
                fontFamily: fonts.body, resize: "vertical", outline: "none",
                background: "#fafafa", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = c.primary)}
              onBlur={(e) => (e.currentTarget.style.borderColor = c.subtle)}
            />
          </div>

          <p style={{ fontSize: "12px", color: c.earth300, marginBottom: "16px" }}>
            Sending as <strong>{repliedBy}</strong> · This will close the ticket
          </p>

          {error && (
            <p style={{ fontSize: "13px", color: "#B91C1C", background: "#FEF2F2", padding: "8px 12px", borderRadius: "6px", marginBottom: "12px" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 18px", borderRadius: "8px", border: `1px solid ${c.subtle}`,
                background: "transparent", color: c.earth600, fontSize: "14px", fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !reply.trim()}
              style={{
                padding: "9px 20px", borderRadius: "8px", border: "none",
                background: `linear-gradient(135deg, ${c.primary}, #054348)`,
                color: "#fff", fontSize: "14px", fontWeight: 600, cursor: sending ? "not-allowed" : "pointer",
                opacity: sending || !reply.trim() ? 0.6 : 1,
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {sending ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 14, height: 14 }} />}
              {sending ? "Sending…" : "Send Reply & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const { user } = useAuth()
  const { fetchTickets, replyTicket } = useAdminSupport()

  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"open" | "closed" | "all">("open")
  const [replyingTo, setReplyingTo] = useState<SupportTicket | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const load = useCallback(async () => {
    try {
      const result = await fetchTickets(statusFilter)
      setTickets(result.tickets)
      setCount(result.count)
      setLastRefreshed(new Date())
      // Reset backoff on success so the next poll resumes the base 30s cadence.
      pollBackoffRef.current = 0
      return true
    } catch {
      // fail silently on polling — exponential backoff handled below
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchTickets, statusFilter])

  const pollBackoffRef = useRef(0)
  // Adaptive polling — 30s on success, doubling on failure up to ~10min,
  // so a transient backend outage doesn't pin a tab to constant retry traffic
  // (which used to hammer error-reporting + clog the admin's network panel).
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const tick = async () => {
      if (cancelled) return
      const ok = await load()
      if (cancelled) return
      const baseMs = 30_000
      const maxMs = 10 * 60 * 1000
      if (ok) {
        pollBackoffRef.current = 0
        timer = setTimeout(tick, baseMs)
      } else {
        const nextDelay = Math.min(maxMs, baseMs * Math.pow(2, pollBackoffRef.current))
        pollBackoffRef.current += 1
        timer = setTimeout(tick, nextDelay)
      }
    }
    setLoading(true)
    tick()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [load])

  const handleReply = async (id: string, reply: string) => {
    const ok = await replyTicket(id, reply, user?.name || "VastuCart Support")
    if (!ok) throw new Error("Failed to send")
    // Update local state immediately (optimistic)
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "closed" as const,
              admin_reply: reply,
              admin_reply_at: new Date().toISOString(),
              admin_reply_by: user?.name || "VastuCart Support",
            }
          : t
      )
    )
  }

  const openCount = tickets.filter((t) => t.status === "open").length

  return (
    <>
      <div style={{ padding: "24px", maxWidth: "900px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: c.earth700, fontFamily: fonts.heading, margin: 0 }}>
                Support Tickets
              </h1>
              <p style={{ fontSize: "13px", color: c.earth400, margin: "4px 0 0" }}>
                {openCount > 0 ? (
                  <span style={{ color: c.warning, fontWeight: 600 }}>{openCount} open ticket{openCount !== 1 ? "s" : ""} awaiting reply</span>
                ) : (
                  "No open tickets"
                )}
                {" · "}
                <span>Refreshes every 30s · Last: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </p>
            </div>
            <button
              onClick={() => { setLoading(true); load() }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "8px 16px", borderRadius: "8px", border: `1px solid ${c.subtle}`,
                background: c.card, color: c.earth600, fontSize: "13px", fontWeight: 500, cursor: "pointer",
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["open", "closed", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "7px 18px", borderRadius: "8px", border: "none",
                background: statusFilter === s ? `linear-gradient(135deg, ${c.primary}, #054348)` : c.card,
                color: statusFilter === s ? "#fff" : c.earth600,
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
                boxShadow: statusFilter === s ? "none" : `0 0 0 1px ${c.subtle}`,
                textTransform: "capitalize",
              }}
            >
              {s === "open" ? `Open${openCount > 0 ? ` (${openCount})` : ""}` : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Tickets list */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <Loader2 style={{ width: 24, height: 24, color: c.primary }} className="animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div
            style={{
              textAlign: "center", padding: "56px 24px",
              background: c.card, borderRadius: "12px", border: `1px solid ${c.subtle}`,
            }}
          >
            <MessageSquare style={{ width: 40, height: 40, color: c.earth300, margin: "0 auto 12px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, color: c.earth600, margin: "0 0 4px" }}>
              No {statusFilter !== "all" ? statusFilter : ""} tickets
            </p>
            <p style={{ fontSize: "13px", color: c.earth400, margin: 0 }}>
              {statusFilter === "open" ? "All caught up!" : "No tickets match this filter"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {tickets.map((ticket) => {
              const catColor = CATEGORY_COLORS[ticket.category] || "#6B7280"
              return (
                <div
                  key={ticket.id}
                  style={{
                    background: c.card, borderRadius: "12px",
                    border: `1px solid ${ticket.status === "open" ? "#FDE68A" : c.subtle}`,
                    overflow: "hidden",
                  }}
                >
                  {/* Ticket header */}
                  <div
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 18px", flexWrap: "wrap", gap: "10px",
                      background: ticket.status === "open" ? "#FFFBEB" : "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <StatusBadge status={ticket.status} />
                      <span
                        style={{
                          padding: "2px 10px", borderRadius: "9999px", fontSize: "11px",
                          fontWeight: 600, background: `${catColor}15`, color: catColor,
                        }}
                      >
                        {ticket.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: c.earth300 }}>{formatDate(ticket.created_at)}</span>
                  </div>

                  {/* Customer info + message */}
                  <div style={{ padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `${c.primary}20`,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <User style={{ width: 16, height: 16, color: c.primary }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: c.earth700, margin: 0 }}>
                          {ticket.customer_name}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Mail style={{ width: 11, height: 11, color: c.earth300 }} />
                          <span style={{ fontSize: "12px", color: c.earth400 }}>{ticket.customer_email}</span>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: "14px", color: c.earth600, lineHeight: "1.6", margin: 0 }}>
                      {ticket.message}
                    </p>
                  </div>

                  {/* Admin reply (if exists) */}
                  {ticket.admin_reply && (
                    <div
                      style={{
                        padding: "14px 18px", borderTop: `1px solid #D1FAE5`,
                        background: c.successLight,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: c.success }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#065F46" }}>
                          {ticket.admin_reply_by} replied
                          {ticket.admin_reply_at ? ` · ${new Date(ticket.admin_reply_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}` : ""}
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", color: "#065F46", margin: 0 }}>{ticket.admin_reply}</p>
                    </div>
                  )}

                  {/* Reply button (only for open tickets) */}
                  {ticket.status === "open" && (
                    <div style={{ padding: "12px 18px", borderTop: `1px solid ${c.subtle}` }}>
                      <button
                        onClick={() => setReplyingTo(ticket)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "6px",
                          padding: "8px 18px", borderRadius: "8px", border: "none",
                          background: `linear-gradient(135deg, ${c.primary}, #054348)`,
                          color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <Send style={{ width: 13, height: 13 }} />
                        Reply & Close
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reply modal */}
      {replyingTo && (
        <ReplyModal
          ticket={replyingTo}
          repliedBy={user?.name || "VastuCart Support"}
          onClose={() => setReplyingTo(null)}
          onSend={handleReply}
        />
      )}
    </>
  )
}
