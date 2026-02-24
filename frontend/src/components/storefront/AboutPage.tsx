"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { primary, secondary, earth, bg, fonts, gradients, shadows } from "@/lib/theme"
import type { AboutConfig } from "@/types/admin-storefront"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const DEFAULT_ABOUT_CONFIG: AboutConfig = {
  heroTagline: "Bringing Sacred India to Every Home",
  heroSubtext: "Authentic spiritual products, sourced directly from artisans across India",
  stats: [
    { label: "Years of Trust", value: "10", suffix: "+" },
    { label: "Artisan Partners", value: "200", suffix: "+" },
    { label: "Products", value: "1500", suffix: "+" },
    { label: "Happy Customers", value: "50000", suffix: "+" },
  ],
  storyTitle: "Our Story",
  storyText:
    "VastuCart was founded with a simple mission: to make authentic spiritual and Vastu products accessible to every home across India. We started when our founder noticed how difficult it was to find genuine, high-quality spiritual products online. Most platforms offered replicas or imported goods lacking the authentic craftsmanship that makes these items truly special.\n\nToday, we source directly from over 200 artisan partners across India — from the brass workshops of Moradabad to the incense makers of Bengaluru. Every product we sell carries the quality and authenticity you deserve.",
  founderName: "Prashant Vaishnav",
  founderRole: "Founder & CEO",
  founderBio:
    "A Vastu practitioner with over a decade of experience, Prashant started VastuCart to bridge the gap between authentic Indian craftsmanship and modern online commerce.",
  artisanRegions: ["Moradabad", "Varanasi", "Jaipur", "Bengaluru", "Rajkot", "Pune"],
}

const VALUES = [
  {
    icon: "✓",
    iconBg: primary[500],
    title: "Authenticity Guaranteed",
    desc: "Every product verified for quality and origin.",
  },
  {
    icon: "🏺",
    iconBg: secondary[500],
    title: "Artisan Direct",
    desc: "200+ artisan partners across India, paid fairly.",
  },
  {
    icon: "🔮",
    iconBg: "#2a7a72",
    title: "Vastu Expertise",
    desc: "Certified Vastu consultants curate every collection.",
  },
  {
    icon: "🔒",
    iconBg: earth[600],
    title: "Secure Shopping",
    desc: "100% secure payments, data never shared.",
  },
]

interface Props {
  config?: AboutConfig | null
}

export function AboutPage({ config: propConfig }: Props) {
  const [config, setConfig] = useState<AboutConfig>(propConfig ?? DEFAULT_ABOUT_CONFIG)
  const [loaded, setLoaded] = useState(!!propConfig)

  useEffect(() => {
    if (propConfig) return
    fetch(`${BACKEND_URL}/store/page-config`, {
      headers: { "x-publishable-api-key": PK },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.about_config) {
          setConfig({ ...DEFAULT_ABOUT_CONFIG, ...data.about_config })
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [propConfig])

  const initials = config.founderName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VastuCart",
    url: "https://store.vastucart.in",
    logo: "https://store.vastucart.in/VastuCartLogo.png",
    description: config.heroSubtext,
    foundingDate: "2014",
    founder: {
      "@type": "Person",
      name: config.founderName,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-98765-43210",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />

      {/* ── Section 1: Hero ─────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "480px",
          background: "linear-gradient(135deg, #013f47 0%, #054348 60%, #1a5c5c 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "rgba(200,81,3,0.08)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "-60px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(42,122,114,0.12)",
            pointerEvents: "none",
          }}
        />

        <span
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: secondary[300],
            textTransform: "uppercase",
            marginBottom: "16px",
            fontFamily: fonts.body,
          }}
        >
          OUR STORY
        </span>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0 0 20px",
            maxWidth: "720px",
            lineHeight: 1.2,
          }}
        >
          {config.heroTagline}
        </h1>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: "1.125rem",
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            maxWidth: "560px",
            lineHeight: 1.7,
          }}
        >
          {config.heroSubtext}
        </p>

        {/* Accent line at bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: gradients.accentBorder,
          }}
        />
      </section>

      {/* ── Section 2: Stats Row ─────────────────────────────────────────────── */}
      <section style={{ background: bg.primary, padding: "56px 24px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {config.stats.map((stat, i) => (
            <div
              key={i}
              style={{
                background: "#ffffff",
                borderLeft: `4px solid ${primary[500]}`,
                borderRadius: "12px",
                padding: "32px 24px",
                textAlign: "center",
                boxShadow: shadows.card,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: primary[500],
                  lineHeight: 1,
                  marginBottom: "10px",
                }}
              >
                {stat.value}
                <span style={{ fontSize: "1.5rem" }}>{stat.suffix}</span>
              </div>
              <div
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  color: earth[500],
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Brand Story ────────────────────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "72px 24px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "56px",
            alignItems: "center",
          }}
          className="about-story-grid"
        >
          {/* Left: text */}
          <div>
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: earth[700],
                margin: "0 0 20px",
              }}
            >
              {config.storyTitle}
            </h2>
            {config.storyText.split("\n\n").map((para, i) => (
              <p
                key={i}
                style={{
                  fontFamily: fonts.body,
                  fontSize: "1rem",
                  color: earth[600],
                  lineHeight: 1.85,
                  margin: "0 0 16px",
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Right: decorative quote block */}
          <div
            style={{
              background: "linear-gradient(135deg, #013f47 0%, #2a7a72 100%)",
              borderRadius: "16px",
              padding: "48px 40px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Dot pattern overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
                pointerEvents: "none",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  fontSize: "4rem",
                  color: secondary[300],
                  fontFamily: fonts.heading,
                  lineHeight: 1,
                  marginBottom: "16px",
                }}
              >
                &ldquo;
              </div>
              <p
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1.125rem",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                  margin: "0 0 24px",
                }}
              >
                {config.storyText.split("\n\n")[0].slice(0, 160).trim()}…
              </p>
              <div
                style={{
                  height: "2px",
                  width: "48px",
                  background: secondary[400],
                  marginBottom: "16px",
                }}
              />
              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.6)",
                  margin: 0,
                  letterSpacing: "0.05em",
                }}
              >
                — {config.founderName}, {config.founderRole}
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .about-story-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ── Section 4: Core Values ──────────────────────────────────────────── */}
      <section style={{ background: bg.primary, padding: "72px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.875rem",
                fontWeight: 700,
                color: primary[900],
                margin: "0 0 12px",
              }}
            >
              Why VastuCart?
            </h2>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: "1rem",
                color: earth[500],
                margin: 0,
              }}
            >
              Our commitment to authenticity and quality runs deep.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {VALUES.map((val, i) => (
              <div
                key={i}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  padding: "32px 24px",
                  boxShadow: shadows.card,
                  borderTop: `4px solid transparent`,
                  backgroundImage: `linear-gradient(#ffffff, #ffffff) padding-box, ${gradients.accentBorder} border-box`,
                  backgroundOrigin: "border-box",
                }}
              >
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: val.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    marginBottom: "16px",
                  }}
                >
                  {val.icon}
                </div>
                <h3
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: earth[700],
                    margin: "0 0 10px",
                  }}
                >
                  {val.title}
                </h3>
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "0.9rem",
                    color: earth[500],
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: Artisan Regions ─────────────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "56px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "1.75rem",
              fontWeight: 700,
              color: primary[900],
              margin: "0 0 12px",
            }}
          >
            Sourced From Across India
          </h2>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: "1rem",
              color: earth[500],
              margin: "0 0 36px",
            }}
          >
            Authentic craftsmanship from the artisan capitals of India
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              justifyContent: "center",
            }}
          >
            {config.artisanRegions.map((region, i) => (
              <span
                key={i}
                style={{
                  padding: "8px 20px",
                  background: primary[50],
                  color: primary[500],
                  borderRadius: "9999px",
                  fontFamily: fonts.body,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  border: `1px solid ${primary[100]}`,
                }}
              >
                📍 {region}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 6: Founder ─────────────────────────────────────────────── */}
      <section style={{ background: bg.primary, padding: "72px 24px" }}>
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: "48px",
            alignItems: "center",
          }}
          className="about-founder-grid"
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${primary[500]}, ${primary[400]})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "2.5rem",
                fontFamily: fonts.heading,
                fontWeight: 700,
                color: "#ffffff",
                boxShadow: "0 8px 24px rgba(1,63,71,0.25)",
              }}
            >
              {initials}
            </div>
            <div
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.125rem",
                fontWeight: 700,
                color: primary[900],
                marginBottom: "4px",
              }}
            >
              {config.founderName}
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: "0.875rem",
                color: secondary[500],
                fontWeight: 600,
              }}
            >
              {config.founderRole}
            </div>
          </div>

          <div>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: "1.0625rem",
                color: earth[600],
                lineHeight: 1.8,
                margin: 0,
                fontStyle: "italic",
              }}
            >
              &ldquo;{config.founderBio}&rdquo;
            </p>
          </div>
        </div>
        <style>{`
          @media (max-width: 600px) {
            .about-founder-grid {
              grid-template-columns: 1fr !important;
              text-align: center;
            }
          }
        `}</style>
      </section>

      {/* ── Section 7: CTA Banner ───────────────────────────────────────────── */}
      <section
        style={{
          background: primary[500],
          padding: "72px 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: "2rem",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0 0 16px",
          }}
        >
          Ready to explore our collection?
        </h2>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: "1.0625rem",
            color: "rgba(255,255,255,0.8)",
            margin: "0 0 40px",
          }}
        >
          Discover thousands of authentic spiritual products, curated by experts.
        </p>
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/collections"
            style={{
              padding: "14px 32px",
              background: secondary[500],
              color: "#ffffff",
              borderRadius: "8px",
              fontFamily: fonts.body,
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              transition: "background 200ms",
            }}
          >
            Shop Now
          </Link>
          <Link
            href="/account/bookings"
            style={{
              padding: "14px 32px",
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              borderRadius: "8px",
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: "1rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "background 200ms",
            }}
          >
            Book Consultation
          </Link>
        </div>
      </section>
    </>
  )
}
