"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, Clock, Monitor, MapPin, Users, ChevronLeft, ChevronRight, Award, ArrowRight, Phone, ArrowLeft } from "lucide-react"
import { normalizeImageUrl } from "@/lib/image-url"
import type { ConsultationDetailType } from "./page"
import { JsonLd } from "@/components/JsonLd"
import { ORGANIZATION_ENTITY_ID } from "@/lib/schema/site-schema"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://store.vastucart.in"
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "https://sapi.vastucart.in"
const PUB_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseIncluded(raw: string): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return raw.split("\n").filter(Boolean) }
}

function toOgUrl(raw: string | undefined | null): string {
  if (!raw) return ""
  const norm = normalizeImageUrl(raw)
  if (!norm) return ""
  return norm.startsWith("http") ? norm : `${SITE_URL}${norm}`
}

function modeLabel(mode: "online" | "offline" | "both") {
  if (mode === "online") return "Online"
  if (mode === "offline") return "In-Person"
  return "Online & In-Person"
}

function ModeIcon({ mode }: { mode: "online" | "offline" | "both" }) {
  if (mode === "online") return <Monitor className="w-4 h-4" />
  if (mode === "offline") return <MapPin className="w-4 h-4" />
  return <Users className="w-4 h-4" />
}

// ─── Image Gallery ────────────────────────────────────────────────────────────

function ImageGallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0)
  const valid = images.filter(Boolean)

  if (valid.length === 0) {
    return (
      <div
        className="w-full rounded-3xl flex items-center justify-center"
        style={{ height: 420, background: "linear-gradient(135deg, #e8f5f3 0%, #c5e8e2 100%)" }}
      >
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="40" fill="rgba(1,63,71,0.08)" />
          <path d="M24 56 L40 24 L56 56 Z" fill="rgba(1,63,71,0.18)" />
          <circle cx="40" cy="24" r="7" fill="rgba(200,81,3,0.35)" />
        </svg>
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{ height: 420, background: "#f0ebe4" }}
      >
        <img
          key={active}
          src={normalizeImageUrl(valid[active])}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
        />
        {valid.length > 1 && (
          <>
            <button
              onClick={() => setActive((i) => (i - 1 + valid.length) % valid.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
              style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActive((i) => (i + 1) % valid.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full transition-opacity hover:opacity-90"
              style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {valid.length > 1 && (
        <div className="flex gap-3 mt-3">
          {valid.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="relative rounded-xl overflow-hidden flex-shrink-0 transition-all"
              style={{
                width: 80, height: 60,
                border: i === active ? "2.5px solid #c85103" : "2px solid transparent",
                outline: "none",
              }}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={normalizeImageUrl(img)}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
              />
              {i !== active && (
                <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.3)" }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Other Consultations ──────────────────────────────────────────────────────

function OtherConsultations({ currentId }: { currentId: string }) {
  const [others, setOthers] = useState<ConsultationDetailType[]>([])

  useEffect(() => {
    fetch(`${BACKEND_URL}/store/bookings/service-types`, {
      headers: { "x-publishable-api-key": PUB_KEY },
    })
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.service_types || []).filter((s: ConsultationDetailType) => s.id !== currentId)
        setOthers(filtered.slice(0, 3))
      })
      .catch(() => {})
  }, [currentId])

  if (others.length === 0) return null

  return (
    <div className="mt-16 pt-12" style={{ borderTop: "1px solid #e8e0d8" }}>
      <h2
        className="text-2xl font-bold mb-8 text-center"
        style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}
      >
        Other Consultations
      </h2>
      <div className={`grid gap-6 ${others.length === 1 ? "max-w-sm mx-auto" : others.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {others.map((s) => (
          <Link
            key={s.id}
            href={s.slug ? `/consultations/${s.slug}` : `/account/bookings?type=${s.id}`}
            className="group flex flex-col rounded-2xl overflow-hidden transition-shadow hover:shadow-xl"
            style={{ background: "#fff", border: "1px solid #e8e0d8", boxShadow: "0 2px 12px rgba(1,63,71,0.05)" }}
          >
            {s.image_1 && (
              <div className="overflow-hidden" style={{ height: 160 }}>
                <img
                  src={normalizeImageUrl(s.image_1)}
                  alt={s.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              </div>
            )}
            <div className="p-4">
              <p className="font-bold mb-1" style={{ color: "#3d2c1e", fontSize: 15 }}>{s.title}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "#9a7c68" }}>{s.duration_minutes} min</span>
                {s.price > 0 && (
                  <span className="text-sm font-bold" style={{ color: "#013f47" }}>₹{s.price.toLocaleString("en-IN")}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConsultationDetailClient({ serviceType: s }: { serviceType: ConsultationDetailType }) {
  const included = parseIncluded(s.what_is_included)
  const images = [s.image_1, s.image_2, s.image_3].filter(Boolean)

  const pageUrl = `${SITE_URL}/consultations/${s.slug}`

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description || undefined,
    url: pageUrl,
    ...(images.length > 0 ? { image: images.map(toOgUrl).filter(Boolean) } : {}),
    // Reference the canonical Organization (emitted site-wide by site-schema)
    // instead of a competing standalone node — one entity, not two.
    provider: { "@id": ORGANIZATION_ENTITY_ID },
    offers: {
      "@type": "Offer",
      price: s.price,
      priceCurrency: s.currency || "INR",
      availability: "https://schema.org/InStock",
      url: pageUrl,
    },
    areaServed: { "@type": "Country", name: "India" },
    serviceType: "Vastu Shastra Consultation",
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Consultations", item: `${SITE_URL}/consultations` },
      { "@type": "ListItem", position: 3, name: s.title, item: pageUrl },
    ],
  }

  return (
    <>
      {/* JSON-LD */}
      <JsonLd data={serviceJsonLd} id="consultation-service" />
      <JsonLd data={breadcrumbJsonLd} id="consultation-breadcrumb" />

      <div style={{ minHeight: "100vh", background: "#fffbf5" }}>

        {/* Breadcrumb */}
        <div style={{ background: "#fff", borderBottom: "1px solid #f0ebe4" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-xs" style={{ color: "#9a7c68" }} aria-label="Breadcrumb">
              <Link href="/" className="hover:underline" style={{ color: "#9a7c68" }}>Home</Link>
              <span>/</span>
              <Link href="/consultations" className="hover:underline" style={{ color: "#9a7c68" }}>Consultations</Link>
              <span>/</span>
              <span style={{ color: "#3d2c1e", fontWeight: 600 }}>{s.title}</span>
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">

            {/* ── Left: Image + Details ── */}
            <div>
              <ImageGallery images={images} title={s.title} />

              {/* About */}
              {s.description && (
                <div className="mt-10">
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}>
                    About This Consultation
                  </h2>
                  <p style={{ color: "#5c4433", fontSize: 15, lineHeight: 1.8 }}>{s.description}</p>
                </div>
              )}

              {/* What's Included */}
              {included.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-lg font-bold mb-4" style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}>
                    What&apos;s Included
                  </h2>
                  <ul className="space-y-3">
                    {included.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="flex-shrink-0 flex items-center justify-center"
                          style={{ width: 22, height: 22, borderRadius: "50%", background: "#e8f5f3", border: "1px solid #c5e8e2", marginTop: 1 }}
                        >
                          <Check className="w-3 h-3" style={{ color: "#013f47" }} />
                        </span>
                        <span style={{ color: "#5c4433", fontSize: 15, lineHeight: 1.6 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What You'll Achieve */}
              {s.outcomes && (
                <div className="mt-10">
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)" }}>
                    What You&apos;ll Achieve
                  </h2>
                  <div
                    className="rounded-2xl p-5"
                    style={{ background: "linear-gradient(135deg, #e8f5f3 0%, #f0ebe4 100%)", border: "1px solid #d5e8e4" }}
                  >
                    <p style={{ color: "#3d2c1e", fontSize: 15, lineHeight: 1.75 }}>{s.outcomes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Right: Booking Card (sticky on desktop) ── */}
            <div className="lg:sticky lg:top-6">
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: "#fff", border: "1px solid #e8e0d8", boxShadow: "0 8px 40px rgba(1,63,71,0.08)" }}
              >
                <div className="p-6 pb-5">
                  {/* Badge */}
                  {s.badge_text && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: "#c85103", color: "#fff" }}>
                      {s.badge_text}
                    </div>
                  )}

                  {/* Title */}
                  <h1
                    className="font-bold mb-3"
                    style={{ color: "#3d2c1e", fontFamily: "var(--font-heading, serif)", fontSize: "clamp(1.35rem, 2.5vw, 1.6rem)", lineHeight: 1.25 }}
                  >
                    {s.title}
                  </h1>

                  {/* Mode chip */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-5"
                    style={{ background: "#e8f5f3", color: "#013f47" }}
                  >
                    <ModeIcon mode={s.mode} />
                    {modeLabel(s.mode)}
                  </div>

                  <div style={{ borderTop: "1px solid #f0ebe4", paddingTop: 16, marginBottom: 16 }}>
                    {/* Duration */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="flex items-center gap-2 text-sm" style={{ color: "#9a7c68" }}>
                        <Clock className="w-4 h-4" />
                        Duration
                      </span>
                      <span className="text-sm font-semibold" style={{ color: "#3d2c1e" }}>{s.duration_minutes} minutes</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: "#9a7c68" }}>Price</span>
                      {s.price > 0 ? (
                        <span className="text-2xl font-bold" style={{ color: "#013f47" }}>
                          ₹{s.price.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-lg font-bold" style={{ color: "#10B981" }}>Free Consultation</span>
                      )}
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <Link
                    href={`/account/bookings?type=${s.id}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity hover:opacity-90 mb-3"
                    style={{ background: "linear-gradient(135deg, #c85103 0%, #a84502 100%)" }}
                  >
                    Book This Consultation
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Secondary CTA */}
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ border: "1.5px solid #013f47", color: "#013f47" }}
                  >
                    <Phone className="w-4 h-4" />
                    Talk to an Expert First
                  </Link>

                  {/* Trust strip */}
                  <div
                    className="flex items-center gap-3 mt-5 pt-5"
                    style={{ borderTop: "1px solid #f0ebe4" }}
                  >
                    <div
                      style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: "rgba(200,81,3,0.1)", border: "1px solid rgba(200,81,3,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Award className="w-4.5 h-4.5" style={{ color: "#c85103" }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#3d2c1e" }}>Certified & Trusted</p>
                      <p className="text-xs" style={{ color: "#9a7c68" }}>Vaastu International · Since 2019</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back link */}
              <div className="mt-4 text-center">
                <Link
                  href="/consultations"
                  className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
                  style={{ color: "#9a7c68" }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  All Consultations
                </Link>
              </div>
            </div>

          </div>

          {/* Other consultations */}
          <OtherConsultations currentId={s.id} />
        </div>
      </div>
    </>
  )
}
