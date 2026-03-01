"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Monitor, MapPin, Users, ChevronLeft, ChevronRight, Check, ArrowRight, Star, Phone, FileText, Search, Zap, Award } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-url"
import type { ServiceType } from "./page"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseIncluded(raw: string): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return raw.split("\n").filter(Boolean) }
}

function ModeIcon({ mode }: { mode: "online" | "offline" | "both" }) {
  if (mode === "online") return <Monitor className="w-3.5 h-3.5" />
  if (mode === "offline") return <MapPin className="w-3.5 h-3.5" />
  return <Users className="w-3.5 h-3.5" />
}

function modeLabel(mode: "online" | "offline" | "both") {
  if (mode === "online") return "Online"
  if (mode === "offline") return "In-Person"
  return "Online & In-Person"
}

// ─── Image Carousel ───────────────────────────────────────────────────────────

function ServiceCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0)
  const valid = images.filter(Boolean)

  if (valid.length === 0) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: 240,
          background: "linear-gradient(135deg, #e8f5f3 0%, #c5e8e2 100%)",
        }}
      >
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
          <circle cx="32" cy="32" r="32" fill="rgba(1,63,71,0.08)" />
          <path d="M20 44 L32 20 L44 44 Z" fill="rgba(1,63,71,0.18)" />
          <circle cx="32" cy="20" r="5" fill="rgba(200,81,3,0.4)" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden" style={{ height: 240, background: "#f0ebe4" }}>
      <img
        src={normalizeImageUrl(valid[idx])}
        alt=""
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
      {valid.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + valid.length) % valid.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
            style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % valid.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
            style={{ background: "rgba(0,0,0,0.4)", color: "#fff" }}
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === idx ? "#fff" : "rgba(255,255,255,0.5)",
                  transition: "all 0.2s",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({ type }: { type: ServiceType }) {
  const included = parseIncluded(type.what_is_included)

  return (
    <div
      className="flex flex-col rounded-3xl overflow-hidden transition-shadow duration-300 hover:shadow-2xl"
      style={{
        background: "#ffffff",
        border: "1px solid #e8e0d8",
        boxShadow: "0 4px 24px rgba(1,63,71,0.06)",
      }}
    >
      {/* Image carousel */}
      <div className="relative">
        <ServiceCarousel images={[type.image_1, type.image_2, type.image_3]} />
        {/* Badge overlay */}
        {type.badge_text && (
          <div
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: "#c85103", color: "#fff", letterSpacing: "0.03em" }}
          >
            {type.badge_text}
          </div>
        )}
        {/* Mode overlay */}
        <div
          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.92)", color: "#013f47" }}
        >
          <ModeIcon mode={type.mode} />
          {modeLabel(type.mode)}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        {/* Title + duration + price */}
        <div className="mb-3">
          <h3
            className="text-xl font-bold mb-1"
            style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)", lineHeight: 1.25 }}
          >
            {type.title}
          </h3>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-sm" style={{ color: "#9a7c68" }}>
              <Clock className="w-3.5 h-3.5" />
              {type.duration_minutes} min
            </span>
            {type.price > 0 ? (
              <span className="text-lg font-bold" style={{ color: "#013f47" }}>
                ₹{type.price.toLocaleString("en-IN")}
              </span>
            ) : (
              <span className="text-sm font-semibold" style={{ color: "#10B981" }}>Free Consultation</span>
            )}
          </div>
        </div>

        {/* Description */}
        {type.description && (
          <p className="text-sm leading-relaxed mb-4" style={{ color: "#5c4433" }}>
            {type.description}
          </p>
        )}

        {/* What's Included */}
        {included.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#013f47" }}>
              What&apos;s Included
            </p>
            <ul className="space-y-1.5">
              {included.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "#5c4433" }}>
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#10B981" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Outcomes */}
        {type.outcomes && (
          <div
            className="rounded-2xl p-3 mb-4"
            style={{ background: "#e8f5f3", border: "1px solid #c5e8e2" }}
          >
            <p className="text-xs font-bold mb-1" style={{ color: "#013f47" }}>You&apos;ll Get</p>
            <p className="text-sm" style={{ color: "#5c4433" }}>{type.outcomes}</p>
          </div>
        )}

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* CTA — deep-link to detail page (SEO) or booking form fallback */}
        <Link
          href={type.slug ? `/consultations/${type.slug}` : `/account/bookings?type=${type.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 mt-2"
          style={{ background: "linear-gradient(135deg, #013f47 0%, #026b7a 100%)" }}
        >
          View &amp; Book
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const HERO_STEPS = [
  {
    step: "01",
    Icon: FileText,
    title: "Share Your Floor Plan",
    desc: "Upload your layout or describe your home, office, or plot — we handle the rest",
  },
  {
    step: "02",
    Icon: Search,
    title: "Expert Vastu Diagnosis",
    desc: "Your expert identifies energy blockages, wrong directions, and zone imbalances",
  },
  {
    step: "03",
    Icon: Zap,
    title: "Written Report + Follow-up",
    desc: "Get a detailed remedy plan delivered in writing, plus a 30-day check-in call — guaranteed",
  },
] as const

export default function ConsultationsClient({ serviceTypes }: { serviceTypes: ServiceType[] }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fffbf5" }}>

      {/* ─── Premium Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: "#051c20" }}>

        {/* Background: mandala SVG + radial glows */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
          <svg
            className="absolute opacity-[0.045]"
            style={{ top: -80, right: -80, width: 600, height: 600 }}
            viewBox="0 0 600 600"
            fill="none"
          >
            {[70, 120, 170, 225, 278].map((r) => (
              <circle key={r} cx="300" cy="300" r={r} stroke="white" strokeWidth="1" />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i * 30 * Math.PI) / 180
              return (
                <line
                  key={i}
                  x1={300 + 70 * Math.cos(a)} y1={300 + 70 * Math.sin(a)}
                  x2={300 + 278 * Math.cos(a)} y2={300 + 278 * Math.sin(a)}
                  stroke="white" strokeWidth="0.6" opacity="0.7"
                />
              )
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i * 45 * Math.PI) / 180
              return (
                <circle key={i} cx={300 + 190 * Math.cos(a)} cy={300 + 190 * Math.sin(a)} r={16} stroke="white" strokeWidth="0.6" />
              )
            })}
          </svg>
          <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(ellipse at 85% 35%, rgba(200,81,3,0.09) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "45%", height: "65%", background: "radial-gradient(ellipse at 15% 85%, rgba(1,63,71,0.45) 0%, transparent 60%)" }} />
        </div>

        {/* Main grid */}
        <div
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          style={{ paddingTop: 88, paddingBottom: 80 }}
        >
          <div className="grid lg:grid-cols-[1fr_420px] gap-12 lg:gap-20 items-center">

            {/* ── Left: Copy ── */}
            <div>
              {/* Eyebrow rule */}
              <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
                <div style={{ width: 32, height: 2, background: "#c85103", borderRadius: 1, flexShrink: 0 }} />
                <span style={{ color: "#b89c7a", fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Vastu Shastra · Est. 2019
                </span>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: "var(--font-heading, serif)",
                  fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1.1,
                  marginBottom: 20,
                  letterSpacing: "-0.01em",
                }}
              >
                Your Home Has Energy.
                <br />Is It Working{" "}
                <span style={{ color: "#c85103" }}>For You</span>
                <br />— or Against You?
              </h1>

              {/* Sub-headline */}
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 17, lineHeight: 1.75, maxWidth: 520, marginBottom: 28 }}>
                Most people live with invisible friction in their space — blocked finances, disrupted sleep,
                strained relationships. Our certified Vastu experts diagnose your exact floor plan and
                prescribe remedies that create measurable change.
              </p>

              {/* Feature checklist */}
              <ul className="space-y-3" style={{ marginBottom: 36 }}>
                {[
                  "Personalised to your exact floor plan — not generic advice",
                  "Certified experts, 15+ years of practice, 500+ families served",
                  "Online & in-person sessions, pan-India · 30-day follow-up included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 flex items-center justify-center"
                      style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: "rgba(200,81,3,0.18)",
                        border: "1px solid rgba(200,81,3,0.35)",
                        marginTop: 2,
                      }}
                    >
                      <Check className="w-3 h-3" style={{ color: "#c85103" }} />
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, lineHeight: 1.6 }}>{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4" style={{ marginBottom: 44 }}>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#c85103", padding: "15px 30px", fontSize: 15 }}
                >
                  See All Consultations
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    color: "#fff",
                    border: "1.5px solid rgba(255,255,255,0.18)",
                    padding: "15px 30px",
                    fontSize: 15,
                  }}
                >
                  <Phone className="w-4 h-4" />
                  Talk to an Expert First
                </Link>
              </div>

              {/* Stats row */}
              <div
                className="flex flex-wrap"
                style={{ gap: "20px 40px", paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.1)" }}
              >
                {[
                  { num: "500+", label: "Families Helped" },
                  { num: "4.9★", label: "Avg Rating" },
                  { num: "20+", label: "Cities" },
                  { num: "30-day", label: "Follow-up Included" },
                ].map(({ num, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{num}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 3 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Process Card (lg+ only) ── */}
            <div className="hidden lg:block">
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 24,
                  padding: "32px 28px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#c5e8e2",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 24,
                  }}
                >
                  How We Help You
                </p>

                {HERO_STEPS.map(({ step, Icon, title, desc }, i) => (
                  <div key={step} style={{ display: "flex", gap: 16 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                          background: i === 0 ? "#c85103" : "rgba(255,255,255,0.06)",
                          border: i !== 0 ? "1px solid rgba(255,255,255,0.12)" : "none",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: i === 0 ? "#fff" : "rgba(255,255,255,0.45)" }} />
                      </div>
                      {i < 2 && (
                        <div style={{ width: 1, flex: 1, minHeight: 32, background: "rgba(255,255,255,0.09)", margin: "8px 0" }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < 2 ? 24 : 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#c85103", letterSpacing: "0.1em", marginBottom: 3 }}>
                        STEP {step}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>{desc}</div>
                    </div>
                  </div>
                ))}

                {/* Trust badge */}
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.09)",
                    marginTop: 20,
                    paddingTop: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(200,81,3,0.12)",
                      border: "1px solid rgba(200,81,3,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Award className="w-5 h-5" style={{ color: "#c85103" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Certified & Trusted</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>Vaastu International · Since 2019</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom accent line */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent 0%, #c85103 25%, #013f47 50%, #c85103 75%, transparent 100%)" }} />
      </div>

      {/* ─── Services Grid ────────────────────────────────────────────────────── */}
      <div id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {serviceTypes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-semibold" style={{ color: "#5c4433" }}>
              No consultations available at the moment.
            </p>
            <p className="text-sm mt-2" style={{ color: "#9a7c68" }}>
              Please check back soon or contact us directly.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
              style={{ background: "#013f47" }}
            >
              <Phone className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-12">
              <h2
                className="text-3xl font-bold mb-3"
                style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}
              >
                Our Consultation Services
              </h2>
              <p className="text-base" style={{ color: "#9a7c68" }}>
                Choose the consultation that&apos;s right for you
              </p>
            </div>

            <div className={`grid gap-8 ${
              serviceTypes.length === 1
                ? "max-w-md mx-auto"
                : serviceTypes.length === 2
                ? "grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {serviceTypes.map((type) => (
                <ServiceCard key={type.id} type={type} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Bottom CTA Strip ─────────────────────────────────────────────────── */}
      <div
        className="py-14"
        style={{ background: "linear-gradient(135deg, #f0ebe4 0%, #e8f5f3 100%)" }}
      >
        <div className="max-w-2xl mx-auto text-center px-4">
          <h3
            className="text-2xl font-bold mb-3"
            style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}
          >
            Not Sure Which to Choose?
          </h3>
          <p className="text-sm mb-6" style={{ color: "#9a7c68" }}>
            Book any consultation and our expert will guide you to the right solution during the session.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/account/bookings"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-white font-bold text-sm transition-opacity hover:opacity-90"
              style={{ background: "#013f47" }}
            >
              Book a Session
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm transition-opacity hover:opacity-80"
              style={{ background: "#fff", color: "#013f47", border: "1.5px solid #013f47" }}
            >
              <Phone className="w-4 h-4" />
              Talk to Us First
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
