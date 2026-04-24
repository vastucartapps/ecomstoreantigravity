"use client"

import type {
  AbandonedCartAttempt,
  AbandonedCartStats,
  RecoveredFilter,
  StageFilter,
  WindowChoice,
} from "@/types/admin-abandoned-carts"

interface Props {
  isLoading: boolean
  window: WindowChoice
  onChangeWindow: (w: WindowChoice) => void
  stage: StageFilter
  onChangeStage: (s: StageFilter) => void
  recovered: RecoveredFilter
  onChangeRecovered: (r: RecoveredFilter) => void
  stats: AbandonedCartStats | null
  attempts: AbandonedCartAttempt[]
}

const STAGE_LABEL: Record<number, string> = { 1: "1h reminder", 2: "24h reminder", 3: "72h discount" }
const STAGE_COLOR: Record<number, string> = { 1: "#3b82f6", 2: "#f59e0b", 3: "#c85103" }

function fmtINR(minor: number): string {
  return `₹${(minor / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function AbandonedCartsDashboard({
  isLoading,
  window,
  onChangeWindow,
  stage,
  onChangeStage,
  recovered,
  onChangeRecovered,
  stats,
  attempts,
}: Props) {
  return (
    <div style={{ padding: 24, fontFamily: "Open Sans, sans-serif", color: "#2b2520" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif", color: "#013f47" }}>
            Abandoned Cart Recovery
          </h1>
          <p style={{ fontSize: 13, color: "#6b5d52", margin: "4px 0 0" }}>
            3-stage recovery emails (1h / 24h / 72h with discount) and the revenue they bring back.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <WindowTabs value={window} onChange={onChangeWindow} />
          <select value={stage} onChange={(e) => onChangeStage(e.target.value as StageFilter)} style={selectStyle}>
            <option value="all">All stages</option>
            <option value="1">Stage 1 (1h)</option>
            <option value="2">Stage 2 (24h)</option>
            <option value="3">Stage 3 (72h)</option>
          </select>
          <select value={recovered} onChange={(e) => onChangeRecovered(e.target.value as RecoveredFilter)} style={selectStyle}>
            <option value="all">All outcomes</option>
            <option value="true">Recovered</option>
            <option value="false">Not yet</option>
          </select>
        </div>
      </div>

      {isLoading && !stats && (
        <div style={{ padding: 48, textAlign: "center", color: "#8a7a6b" }}>Loading…</div>
      )}

      {stats && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard label="Emails sent" value={stats.total_sent.toLocaleString()} color="#013f47" />
            <StatCard label="Carts recovered" value={stats.recovered.toLocaleString()} color="#10b981" />
            <StatCard label="Recovery rate" value={`${(stats.recovery_rate * 100).toFixed(1)}%`} color="#013f47" hint="recovered / unique carts emailed" />
            <StatCard label="Revenue recovered" value={fmtINR(stats.recovered_revenue_minor)} color="#c85103" />
          </div>

          <Card title="By stage">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[1, 2, 3].map((s) => {
                const v = stats.by_stage[s as 1 | 2 | 3] || 0
                return (
                  <div key={s} style={{ border: "1px solid #f0e6d8", borderRadius: 8, padding: 14, background: "#fffbf5" }}>
                    <div style={{ fontSize: 11, color: STAGE_COLOR[s], textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
                      Stage {s} · {STAGE_LABEL[s]}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#2b2520", marginTop: 4, fontFamily: "Cormorant Garamond, serif" }}>
                      {v.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: "#8a7a6b", marginTop: 2 }}>emails sent</div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card title={`Attempts (${attempts.length})`} style={{ marginTop: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Sent</th>
                    <th style={thStyle}>Stage</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Cart</th>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Recovered</th>
                    <th style={thNumStyle}>Order value</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id}>
                      <td style={tdStyle}>{fmtDate(a.sent_at)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: STAGE_COLOR[a.stage] + "22", color: STAGE_COLOR[a.stage], fontSize: 12, fontWeight: 600 }}>
                          {a.stage}
                        </span>
                      </td>
                      <td style={tdStyle}>{a.email}</td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{a.cart_id.slice(-8)}</code></td>
                      <td style={tdStyle}>{a.discount_code ? <code>{a.discount_code}</code> : "—"}</td>
                      <td style={tdStyle}>
                        {a.recovered_at ? (
                          <span style={{ color: "#10b981", fontWeight: 600 }}>✓ {fmtDate(a.recovered_at)}</span>
                        ) : (
                          <span style={{ color: "#8a7a6b" }}>—</span>
                        )}
                      </td>
                      <td style={tdNumStyle}>{a.recovered_amount > 0 ? fmtINR(a.recovered_amount) : "—"}</td>
                    </tr>
                  ))}
                  {attempts.length === 0 && (
                    <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#8a7a6b", padding: 24 }}>No attempts in this window</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

function WindowTabs({ value, onChange }: { value: WindowChoice; onChange: (w: WindowChoice) => void }) {
  const options: Array<{ v: WindowChoice; l: string }> = [
    { v: "24h", l: "24h" },
    { v: "7d", l: "7d" },
    { v: "30d", l: "30d" },
  ]
  return (
    <div style={{ display: "inline-flex", background: "#f2eadf", borderRadius: 6, padding: 2 }}>
      {options.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          style={{
            padding: "6px 14px",
            fontSize: 13,
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            background: value === o.v ? "#013f47" : "transparent",
            color: value === o.v ? "#fff" : "#5a4f47",
            fontWeight: value === o.v ? 600 : 400,
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

function StatCard({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 18, border: "1px solid #f0e6d8", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: 12, color: "#8a7a6b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "Cormorant Garamond, serif" }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: "#8a7a6b", marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: 20, border: "1px solid #f0e6d8", ...style }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 14px", color: "#013f47" }}>{title}</h3>
      {children}
    </div>
  )
}

const selectStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 6, border: "1px solid #e0d4c1", background: "#fff", fontSize: 13, color: "#2b2520", cursor: "pointer" }
const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 }
const thStyle: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #f0e6d8", fontWeight: 600, color: "#6b5d52", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }
const thNumStyle: React.CSSProperties = { ...thStyle, textAlign: "right" }
const tdStyle: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f7efe3" }
const tdNumStyle: React.CSSProperties = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }
