"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Monitor, MapPin, Users, ChevronLeft, ChevronRight, Check, ArrowRight, Star, Phone } from "lucide-react"
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

        {/* CTA */}
        <Link
          href={`/account/bookings?type=${type.id}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 mt-2"
          style={{ background: "linear-gradient(135deg, #013f47 0%, #026b7a 100%)" }}
        >
          Book Consultation
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ConsultationsClient({ serviceTypes }: { serviceTypes: ServiceType[] }) {
  return (
    <div style={{ minHeight: "100vh", background: "#fffbf5" }}>

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #013f47 0%, #026b7a 50%, #013f47 100%)",
          padding: "80px 16px 72px",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c85103 0%, transparent 70%)", transform: "translate(30%, -30%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #c5e8e2 0%, transparent 70%)", transform: "translate(-30%, 30%)" }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(255,255,255,0.12)", color: "#c5e8e2", letterSpacing: "0.06em" }}
          >
            <Star className="w-3.5 h-3.5" style={{ fill: "#c85103", color: "#c85103" }} />
            CERTIFIED VASTU EXPERTS
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-heading, serif)", lineHeight: 1.15 }}
          >
            Transform Your Space with
            <span style={{ color: "#c85103", display: "block" }}>Expert Vastu Guidance</span>
          </h1>
          <p className="text-lg text-white/75 max-w-2xl mx-auto mb-8">
            Our certified Vastu consultants help you harmonise energy in your home, office, or plot —
            bringing prosperity, health, and peace to your life.
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
            {[
              { icon: <Star className="w-4 h-4" style={{ fill: "#c85103", color: "#c85103" }} />, text: "4.9 / 5 rating" },
              { icon: <Users className="w-4 h-4" />, text: "500+ consultations" },
              { icon: <Monitor className="w-4 h-4" />, text: "Online & In-Person" },
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {t.icon}
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accent border */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #013f47, #c85103, #013f47)" }} />

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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

      {/* Bottom CTA strip */}
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
