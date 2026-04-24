"use client"

import { useMemo } from "react"
import type {
  PaymentEventRow,
  PaymentFunnelStats,
  PaymentStage,
  WindowChoice,
} from "@/types/admin-payment-events"

interface Props {
  isLoading: boolean
  window: WindowChoice
  onChangeWindow: (w: WindowChoice) => void
  stage: PaymentStage | "all"
  onChangeStage: (s: PaymentStage | "all") => void
  provider: string
  onChangeProvider: (p: string) => void
  stats: PaymentFunnelStats | null
  events: PaymentEventRow[]
}

const STAGE_COLORS: Record<PaymentStage, string> = {
  initiated: "#3b82f6",
  succeeded: "#10b981",
  failed: "#ef4444",
  dismissed: "#f59e0b",
}

const STAGE_LABELS: Record<PaymentStage, string> = {
  initiated: "Initiated",
  succeeded: "Succeeded",
  failed: "Failed",
  dismissed: "Dismissed",
}

function fmtMoney(minor: number, currency: string): string {
  const major = minor / 100
  const sym = currency.toLowerCase() === "usd" ? "$" : "₹"
  return `${sym}${major.toLocaleString(currency.toLowerCase() === "usd" ? "en-US" : "en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function PaymentEventsDashboard({
  isLoading,
  window,
  onChangeWindow,
  stage,
  onChangeStage,
  provider,
  onChangeProvider,
  stats,
  events,
}: Props) {
  const providers = useMemo(() => {
    const set = new Set<string>()
    if (stats) Object.keys(stats.by_provider).forEach((p) => set.add(p))
    events.forEach((e) => set.add(e.provider))
    return Array.from(set).sort()
  }, [stats, events])

  const funnelMax = stats
    ? Math.max(stats.initiated, stats.succeeded, stats.failed, stats.dismissed, 1)
    : 1

  return (
    <div style={{ padding: 24, fontFamily: "Open Sans, sans-serif", color: "#2b2520" }}>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif", color: "#013f47" }}>
            Payment Funnel
          </h1>
          <p style={{ fontSize: 13, color: "#6b5d52", margin: "4px 0 0" }}>
            Track payment lifecycle — distinguish real gateway failures from abandonments.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <WindowTabs value={window} onChange={onChangeWindow} />
          <select
            value={stage}
            onChange={(e) => onChangeStage(e.target.value as PaymentStage | "all")}
            style={selectStyle}
          >
            <option value="all">All stages</option>
            <option value="initiated">Initiated</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select value={provider} onChange={(e) => onChangeProvider(e.target.value)} style={selectStyle}>
            <option value="all">All providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && !stats && (
        <div style={{ padding: 48, textAlign: "center", color: "#8a7a6b" }}>Loading…</div>
      )}

      {stats && (
        <>
          {/* ── Summary cards ────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard label="Initiated" value={stats.initiated.toLocaleString()} color={STAGE_COLORS.initiated} />
            <StatCard label="Succeeded" value={stats.succeeded.toLocaleString()} color={STAGE_COLORS.succeeded} />
            <StatCard label="Failed" value={stats.failed.toLocaleString()} color={STAGE_COLORS.failed} />
            <StatCard label="Dismissed" value={stats.dismissed.toLocaleString()} color={STAGE_COLORS.dismissed} />
            <StatCard
              label="Conversion"
              value={`${(stats.conversion_rate * 100).toFixed(1)}%`}
              color="#013f47"
              hint="succeeded / initiated"
            />
          </div>

          {/* ── Funnel bars ──────────────────────────────────────────────────── */}
          <Card title="Funnel">
            {(["initiated", "succeeded", "failed", "dismissed"] as PaymentStage[]).map((s) => {
              const v = stats[s]
              const pct = (v / funnelMax) * 100
              return (
                <div key={s} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span>{STAGE_LABELS[s]}</span>
                    <span style={{ color: "#6b5d52" }}>{v.toLocaleString()}</span>
                  </div>
                  <div style={{ height: 10, background: "#f2eadf", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: STAGE_COLORS[s], transition: "width 0.3s" }} />
                  </div>
                </div>
              )
            })}
          </Card>

          {/* ── By provider + top errors ─────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16, marginTop: 16 }}>
            <Card title="By provider">
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Provider</th>
                      <th style={thNumStyle}>Initiated</th>
                      <th style={thNumStyle}>Succeeded</th>
                      <th style={thNumStyle}>Failed</th>
                      <th style={thNumStyle}>Dismissed</th>
                      <th style={thNumStyle}>Conv.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.by_provider).sort((a, b) => b[1].initiated - a[1].initiated).map(([p, s]) => {
                      const conv = s.initiated > 0 ? s.succeeded / s.initiated : 0
                      return (
                        <tr key={p}>
                          <td style={tdStyle}><code>{p}</code></td>
                          <td style={tdNumStyle}>{s.initiated}</td>
                          <td style={{ ...tdNumStyle, color: STAGE_COLORS.succeeded }}>{s.succeeded}</td>
                          <td style={{ ...tdNumStyle, color: STAGE_COLORS.failed }}>{s.failed}</td>
                          <td style={{ ...tdNumStyle, color: STAGE_COLORS.dismissed }}>{s.dismissed}</td>
                          <td style={tdNumStyle}>{(conv * 100).toFixed(1)}%</td>
                        </tr>
                      )
                    })}
                    {Object.keys(stats.by_provider).length === 0 && (
                      <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "#8a7a6b" }}>No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Top error codes">
              {stats.by_error_code.length === 0 ? (
                <p style={{ color: "#8a7a6b", fontSize: 13, margin: 0 }}>No failures recorded in this window — nice.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {stats.by_error_code.map((e) => (
                    <li key={e.error_code} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0e6d8", fontSize: 13 }}>
                      <code style={{ color: STAGE_COLORS.failed }}>{e.error_code}</code>
                      <span>{e.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* ── Recent events table ──────────────────────────────────────────── */}
          <Card title={`Recent events (${events.length})`} style={{ marginTop: 16 }}>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>When</th>
                    <th style={thStyle}>Stage</th>
                    <th style={thStyle}>Provider</th>
                    <th style={thNumStyle}>Amount</th>
                    <th style={thStyle}>Cart</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Error</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td style={tdStyle}>{fmtDate(e.created_at)}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: STAGE_COLORS[e.stage] + "22", color: STAGE_COLORS[e.stage], fontSize: 12, fontWeight: 600 }}>
                          {STAGE_LABELS[e.stage]}
                        </span>
                      </td>
                      <td style={tdStyle}><code>{e.provider}</code></td>
                      <td style={tdNumStyle}>{e.amount > 0 ? fmtMoney(e.amount, e.currency) : "—"}</td>
                      <td style={tdStyle}><code style={{ fontSize: 11 }}>{e.cart_id.slice(-8)}</code></td>
                      <td style={tdStyle}>{e.email || "—"}</td>
                      <td style={{ ...tdStyle, maxWidth: 320 }}>
                        {e.error_code ? (
                          <div>
                            <code style={{ color: STAGE_COLORS.failed, fontSize: 12 }}>{e.error_code}</code>
                            {e.error_message && (
                              <div style={{ fontSize: 12, color: "#6b5d52", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={e.error_message}>
                                {e.error_message}
                              </div>
                            )}
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr><td colSpan={7} style={{ ...tdStyle, textAlign: "center", color: "#8a7a6b", padding: 24 }}>No events in this window</td></tr>
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

const selectStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid #e0d4c1",
  background: "#fff",
  fontSize: 13,
  color: "#2b2520",
  cursor: "pointer",
}

const tableStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 }
const thStyle: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #f0e6d8", fontWeight: 600, color: "#6b5d52", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }
const thNumStyle: React.CSSProperties = { ...thStyle, textAlign: "right" }
const tdStyle: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f7efe3" }
const tdNumStyle: React.CSSProperties = { ...tdStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }
