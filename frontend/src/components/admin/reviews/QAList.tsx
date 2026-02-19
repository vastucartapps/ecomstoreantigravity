"use client"

import { useState, useMemo } from "react"
import { MessageSquare, Pencil, Trash2, Send, Image as ImageIcon } from "lucide-react"
import type { QAItem, QAStatus } from "@/types/admin-review"

const c = {
  primary500: "#013f47", primary400: "#2a7a72", primary100: "#c5e8e2",
  secondary500: "#c85103", secondary50: "#fff5ed",
  bg: "#fffbf5", card: "#ffffff", subtle: "#f5dfbb",
  earth300: "#a39585", earth400: "#75615a", earth500: "#71685b", earth600: "#5a4f47", earth700: "#433b35",
  success: "#10B981", successLight: "#D1FAE5",
  warning: "#F59E0B", warningLight: "#FEF3C7",
  error: "#EF4444", errorLight: "#FEE2E2",
  gradient: "linear-gradient(90deg, #013f47, #2a7a72, #c85103)",
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}
const fonts = { heading: "'Lora', serif", body: "'Open Sans', sans-serif" }

interface QAListProps {
  qaItems: QAItem[]
  statusFilter: QAStatus | "all"
  searchQuery: string
  onChangeStatus: (status: QAStatus | "all") => void
  onAnswer: (id: string, answer: string) => Promise<void>
  onEdit: (id: string, answer: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function QAList({
  qaItems,
  statusFilter,
  searchQuery,
  onChangeStatus,
  onAnswer,
  onEdit,
  onDelete,
}: QAListProps) {
  const [answerText, setAnswerText] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = qaItems
    if (statusFilter !== "all") result = result.filter(q => q.status === statusFilter)
    if (searchQuery) {
      const sq = searchQuery.toLowerCase()
      result = result.filter(
        q =>
          q.customerName.toLowerCase().includes(sq) ||
          q.productName.toLowerCase().includes(sq) ||
          q.question.toLowerCase().includes(sq)
      )
    }
    return result
  }, [qaItems, statusFilter, searchQuery])

  const counts = useMemo(() => ({
    all: qaItems.length,
    unanswered: qaItems.filter(q => q.status === "unanswered").length,
    answered: qaItems.filter(q => q.status === "answered").length,
  }), [qaItems])

  const tabs: Array<{ key: QAStatus | "all"; label: string }> = [
    { key: "all", label: "All" },
    { key: "unanswered", label: "Unanswered" },
    { key: "answered", label: "Answered" },
  ]

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  const handleSubmitAnswer = async (id: string, isEdit: boolean) => {
    const text = answerText[id]?.trim()
    if (!text) return
    setActioningId(id)
    try {
      if (isEdit) {
        await onEdit(id, text)
      } else {
        await onAnswer(id, text)
      }
      setAnswerText(prev => { const n = { ...prev }; delete n[id]; return n })
      setEditingId(null)
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setActioningId(id)
    try {
      await onDelete(id)
      setConfirmDeleteId(null)
    } finally {
      setActioningId(null)
    }
  }

  const startEdit = (q: QAItem) => {
    setEditingId(q.id)
    setAnswerText(prev => ({ ...prev, [q.id]: q.answer || "" }))
  }

  return (
    <div style={{ fontFamily: fonts.body }}>
      {/* Status Sub-Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChangeStatus(tab.key)}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: statusFilter === tab.key ? "none" : `1px solid ${c.earth300}`,
              background: statusFilter === tab.key ? c.primary500 : c.card,
              color: statusFilter === tab.key ? c.card : c.earth600,
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {tab.label}
            <span
              style={{
                background: statusFilter === tab.key ? "rgba(255,255,255,0.2)" : c.earth300,
                color: statusFilter === tab.key ? c.card : c.earth700,
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Q&A Cards */}
      <div style={{ display: "grid", gap: "16px" }}>
        {filtered.map(qa => {
          const isActioning = actioningId === qa.id
          const isEditing = editingId === qa.id

          return (
            <div
              key={qa.id}
              style={{
                background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
                borderRadius: "12px",
                padding: "20px",
                boxShadow: c.shadow,
                borderTop: "4px solid transparent",
                opacity: isActioning ? 0.7 : 1,
                transition: "opacity 200ms",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                {/* Product Thumbnail */}
                <div style={{ flexShrink: 0 }}>
                  {qa.productImageUrl ? (
                    <img
                      src={qa.productImageUrl}
                      alt={qa.productName}
                      style={{ width: "56px", height: "56px", borderRadius: "8px", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "8px",
                      background: c.subtle, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <ImageIcon size={24} style={{ color: c.earth400 }} />
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Product name + status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: c.earth500, fontWeight: 600 }}>
                      {qa.productName}
                    </span>
                    <span style={{
                      background: qa.status === "answered" ? c.successLight : c.warningLight,
                      color: qa.status === "answered" ? c.success : c.warning,
                      padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: 600,
                    }}>
                      {qa.status === "answered" ? "Answered" : "Unanswered"}
                    </span>
                  </div>

                  {/* Question */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "10px" }}>
                    <MessageSquare size={16} style={{ color: c.primary500, marginTop: "2px", flexShrink: 0 }} />
                    <p style={{ color: c.earth700, fontSize: "15px", fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                      {qa.question}
                    </p>
                  </div>

                  {/* Customer + Date */}
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", color: c.earth700, fontWeight: 600 }}>
                      {qa.customerName}
                    </span>
                    <span style={{ fontSize: "12px", color: c.earth400 }}>
                      Asked {formatDate(qa.createdAt)}
                    </span>
                  </div>

                  {/* Existing answer display */}
                  {qa.status === "answered" && qa.answer && !isEditing && (
                    <div style={{
                      background: c.primary100,
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "12px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "12px", color: c.primary500, fontWeight: 700, marginBottom: "6px" }}>
                            {qa.answeredBy || "Admin"} • {qa.answeredAt ? formatDate(qa.answeredAt) : ""}
                          </div>
                          <p style={{ color: c.earth700, fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
                            {qa.answer}
                          </p>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button
                            onClick={() => startEdit(qa)}
                            title="Edit answer"
                            style={{
                              background: "transparent", border: `1px solid ${c.primary400}`,
                              borderRadius: "6px", padding: "6px 8px", cursor: "pointer",
                              color: c.primary500,
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          {confirmDeleteId === qa.id ? (
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                onClick={() => handleDelete(qa.id)}
                                disabled={isActioning}
                                style={{
                                  background: c.error, color: c.card, border: "none",
                                  borderRadius: "6px", padding: "6px 10px",
                                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                }}
                              >
                                {isActioning ? "…" : "Confirm"}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                style={{
                                  background: "transparent", border: `1px solid ${c.earth300}`,
                                  borderRadius: "6px", padding: "6px 8px",
                                  fontSize: "12px", cursor: "pointer", color: c.earth600,
                                }}
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(qa.id)}
                              title="Delete answer"
                              style={{
                                background: "transparent", border: `1px solid ${c.error}`,
                                borderRadius: "6px", padding: "6px 8px", cursor: "pointer",
                                color: c.error,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Answer / Edit textarea */}
                  {(qa.status === "unanswered" || isEditing) && (
                    <div>
                      <textarea
                        value={answerText[qa.id] || ""}
                        onChange={e => setAnswerText(prev => ({ ...prev, [qa.id]: e.target.value }))}
                        placeholder={isEditing ? "Edit your answer…" : "Type an answer for this customer…"}
                        style={{
                          width: "100%", minHeight: "80px", padding: "10px",
                          border: `1px solid ${c.earth300}`, borderRadius: "8px",
                          fontSize: "13px", fontFamily: fonts.body, resize: "vertical",
                          outline: "none", boxSizing: "border-box", marginBottom: "10px",
                        }}
                        onFocus={e => (e.target.style.borderColor = c.primary400)}
                        onBlur={e => (e.target.style.borderColor = c.earth300)}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleSubmitAnswer(qa.id, isEditing)}
                          disabled={isActioning || !answerText[qa.id]?.trim()}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            padding: "8px 16px",
                            background: answerText[qa.id]?.trim() ? c.primary500 : c.earth300,
                            color: c.card, border: "none", borderRadius: "6px",
                            fontSize: "13px", fontWeight: 600,
                            cursor: answerText[qa.id]?.trim() && !isActioning ? "pointer" : "not-allowed",
                          }}
                        >
                          <Send size={14} />
                          {isActioning ? "Saving…" : isEditing ? "Save Changes" : "Submit Answer"}
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => { setEditingId(null); setAnswerText(prev => { const n = { ...prev }; delete n[qa.id]; return n }) }}
                            style={{
                              padding: "8px 14px", background: "transparent",
                              border: `1px solid ${c.earth300}`, borderRadius: "6px",
                              fontSize: "13px", fontWeight: 600, color: c.earth600, cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty States */}
      {filtered.length === 0 && (
        <div style={{
          padding: "64px 32px", textAlign: "center", color: c.earth500,
          background: `linear-gradient(${c.card}, ${c.card}) padding-box, ${c.gradient} border-box`,
          borderRadius: "12px", borderTop: "4px solid transparent", boxShadow: c.shadow,
        }}>
          <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: c.earth700 }}>
            {statusFilter === "unanswered"
              ? "All questions answered"
              : searchQuery
                ? "No results match your search"
                : "No questions yet"}
          </p>
          <p style={{ fontSize: "14px", color: c.earth400 }}>
            {statusFilter === "unanswered"
              ? "Great job — all customer questions have been answered!"
              : "Questions from customers will appear here."}
          </p>
        </div>
      )}
    </div>
  )
}
