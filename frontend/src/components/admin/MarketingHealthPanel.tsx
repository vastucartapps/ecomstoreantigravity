"use client"

import type { MarketingHealthData, MarketingChannelHealth, GA4Snapshot } from "@/types/admin-dashboard"

// ─── Design tokens (matching AdminOverviewDashboard) ─────────────────────────
const primary500 = "#013f47"
const primary100 = "#e0f0f2"
const secondary500 = "#c85103"
const earth700 = "#433b35"
const earth400 = "#8c7b6e"
const earth100 = "#f5f0eb"

const success = "#15803d"
const successBg = "#dcfce7"
const warning = "#b45309"
const warningBg = "#fef3c7"
const error = "#b91c1c"
const errorBg = "#fee2e2"
const neutral = "#71685b"
const neutralBg = "#f5f0eb"

const cardBg = "#ffffff"
const shadow = "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)"

const fonts = {
  heading: "'Lora', serif",
  body: "'Open Sans', sans-serif",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoString: string | null): string {
  if (!isoString) return "Never"
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: MarketingChannelHealth["syncStatus"] }) {
  const map: Record<
    string,
    { label: string; bg: string; color: string; dot: string }
  > = {
    success: { label: "Synced", bg: successBg, color: success, dot: success },
    syncing: { label: "Syncing…", bg: warningBg, color: warning, dot: warning },
    error: { label: "Sync Error", bg: errorBg, color: error, dot: error },
  }
  const style = status ? map[status] : null

  if (!style) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ backgroundColor: neutralBg, color: neutral, fontFamily: fonts.body }}
      >
        <span
          style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: neutral, display: "inline-block" }}
        />
        Not synced
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: style.bg, color: style.color, fontFamily: fonts.body }}
    >
      <span
        style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: style.dot, display: "inline-block" }}
      />
      {style.label}
    </span>
  )
}

// ─── Metric row ──────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs" style={{ color: earth400, fontFamily: fonts.body }}>
        {label}
      </span>
      <span
        className="text-sm font-semibold"
        style={{ color: accent ? secondary500 : earth700, fontFamily: fonts.body }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Mini bar ─────────────────────────────────────────────────────────────────

function MiniBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs w-16 shrink-0" style={{ color: earth400, fontFamily: fonts.body }}>
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: earth100 }}>
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs w-8 text-right" style={{ color: earth700, fontFamily: fonts.body }}>
        {percent}%
      </span>
    </div>
  )
}

// ─── Not configured placeholder ───────────────────────────────────────────────

function NotConfigured({ channel }: { channel: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg"
      style={{ backgroundColor: earth100 }}
    >
      <span className="text-2xl">🔌</span>
      <p className="text-xs text-center" style={{ color: earth400, fontFamily: fonts.body }}>
        {channel} not connected.
        <br />
        Configure in <strong>Integrations</strong>.
      </p>
    </div>
  )
}

// ─── GA4 Card ────────────────────────────────────────────────────────────────

function GA4Card({
  data,
}: {
  data: MarketingHealthData["ga4"]
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: cardBg, boxShadow: shadow }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: earth700, fontFamily: fonts.heading }}
          >
            Traffic
          </h3>
          <p className="text-xs mt-0.5" style={{ color: earth400, fontFamily: fonts.body }}>
            Last 7 days · Google Analytics
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: primary100 }}
        >
          📊
        </div>
      </div>

      {/* Body */}
      {!data.configured ? (
        <NotConfigured channel="Google Analytics" />
      ) : data.error ? (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
          style={{ backgroundColor: errorBg, color: error, fontFamily: fonts.body }}
        >
          ⚠ {data.error}
        </div>
      ) : data.snapshot ? (
        <div className="flex flex-col gap-1">
          {/* Key numbers */}
          <div
            className="grid grid-cols-3 gap-2 p-3 rounded-lg mb-1"
            style={{ backgroundColor: earth100 }}
          >
            {[
              { label: "Sessions", value: formatNumber(data.snapshot.sessions) },
              { label: "Users", value: formatNumber(data.snapshot.users) },
              { label: "Pageviews", value: formatNumber(data.snapshot.pageviews) },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <div
                  className="text-base font-bold"
                  style={{ color: primary500, fontFamily: fonts.body }}
                >
                  {value}
                </div>
                <div className="text-xs" style={{ color: earth400, fontFamily: fonts.body }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Device split */}
          <div className="flex flex-col gap-1.5 pt-1">
            <p className="text-xs font-medium" style={{ color: earth400, fontFamily: fonts.body }}>
              Device split
            </p>
            <MiniBar label="Mobile" percent={data.snapshot.mobilePercent} color={secondary500} />
            <MiniBar label="Desktop" percent={data.snapshot.desktopPercent} color={primary500} />
          </div>

          {/* Top page */}
          {data.snapshot.topPage && (
            <div className="pt-1">
              <MetricRow
                label="Top page"
                value={
                  data.snapshot.topPage.length > 28
                    ? data.snapshot.topPage.slice(0, 26) + "…"
                    : data.snapshot.topPage
                }
              />
            </div>
          )}
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
          style={{ backgroundColor: neutralBg, color: neutral, fontFamily: fonts.body }}
        >
          No data available for the last 7 days.
        </div>
      )}
    </div>
  )
}

// ─── Channel Card (GMC + Meta share same layout) ──────────────────────────────

function ChannelCard({
  title,
  subtitle,
  emoji,
  data,
  issueLabel,
}: {
  title: string
  subtitle: string
  emoji: string
  data: { configured: boolean; health: MarketingChannelHealth | null }
  issueLabel: string
}) {
  const { configured, health } = data

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: cardBg, boxShadow: shadow }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ color: earth700, fontFamily: fonts.heading }}
          >
            {title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: earth400, fontFamily: fonts.body }}>
            {subtitle}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
          style={{ backgroundColor: primary100 }}
        >
          {emoji}
        </div>
      </div>

      {/* Body */}
      {!configured ? (
        <NotConfigured channel={title} />
      ) : !health ? (
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs"
          style={{ backgroundColor: neutralBg, color: neutral, fontFamily: fonts.body }}
        >
          Status unavailable
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* Status + last sync */}
          <div className="flex items-center justify-between">
            <StatusPill status={health.syncStatus} />
            <span className="text-xs" style={{ color: earth400, fontFamily: fonts.body }}>
              {relativeTime(health.lastSync)}
            </span>
          </div>

          <div
            className="h-px my-1"
            style={{ backgroundColor: earth100 }}
          />

          {/* Metrics */}
          <MetricRow label="Products synced" value={formatNumber(health.productsCount)} />
          <MetricRow
            label={issueLabel}
            value={health.issueCount === 0 ? "✓ None" : `⚠ ${health.issueCount}`}
            accent={health.issueCount > 0}
          />

          {/* Health summary chip */}
          <div
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              backgroundColor: health.issueCount === 0 ? successBg : warningBg,
            }}
          >
            <span className="text-xs" style={{ color: health.issueCount === 0 ? success : warning, fontFamily: fonts.body }}>
              {health.issueCount === 0
                ? `All ${formatNumber(health.productsCount)} products healthy — no issues`
                : `${health.issueCount} product${health.issueCount > 1 ? "s" : ""} need attention`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function MarketingHealthPanel({
  data,
}: {
  data: MarketingHealthData
}) {
  return (
    <div>
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: earth700, fontFamily: fonts.heading }}
        >
          Marketing Channels
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: primary100, color: primary500, fontFamily: fonts.body }}
        >
          Live
        </span>
      </div>

      {/* 3-column grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <GA4Card data={data.ga4} />

        <ChannelCard
          title="Google Merchant"
          subtitle="Shopping feed · GMC"
          emoji="🛒"
          data={data.gmc}
          issueLabel="Disapproved"
        />

        <ChannelCard
          title="Meta Catalogue"
          subtitle="Facebook & Instagram"
          emoji="📘"
          data={data.meta}
          issueLabel="Issues"
        />
      </div>
    </div>
  )
}
