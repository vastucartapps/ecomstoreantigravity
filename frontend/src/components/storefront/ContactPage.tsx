"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { primary, secondary, earth, bg, fonts, gradients, shadows } from "@/lib/theme"
import type { ContactConfig, FaqItem } from "@/types/admin-storefront"

const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const DEFAULT_CONTACT_CONFIG: ContactConfig = {
  phone: "+91 98765 43210",
  email: "support@vastucart.com",
  whatsapp: "+91 98765 43210",
  wholesaleEmail: "wholesale@vastucart.com",
  address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  workingHours: {
    weekdays: "Mon – Sat: 9:00 AM – 6:00 PM IST",
    weekends: "Sunday: Closed",
  },
  faqs: [
    {
      id: "f1",
      question: "How long does delivery take?",
      answer: "Standard delivery takes 7–10 business days. Express delivery is 4–7 business days.",
    },
    {
      id: "f2",
      question: "Do you offer returns?",
      answer: "Yes, within 7 days of delivery for unused items in original packaging.",
    },
    {
      id: "f3",
      question: "Are your products authentic?",
      answer: "Every product is sourced from certified artisans. We verify authenticity before listing.",
    },
    {
      id: "f4",
      question: "Do you ship internationally?",
      answer: "Yes, we ship to 25+ countries. International delivery is 15–30 business days.",
    },
  ],
  grievanceOfficer: {
    name: "Prashant Vaishnav",
    email: "grievance@vastucart.com",
    address: "42 Temple Lane, Varanasi, Uttar Pradesh 221001, India",
  },
}

type FormState = "idle" | "sending" | "success" | "error"

const SUBJECTS = [
  "General Inquiry",
  "Order Issue",
  "Return Request",
  "Wholesale",
  "Vastu Consultation",
  "Other",
]

function isCurrentlyOpen(): boolean {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 6=Sat
  const hour = now.getHours()
  return day >= 1 && day <= 6 && hour >= 9 && hour < 18
}

interface FaqAccordionProps {
  faqs: FaqItem[]
}

function FaqAccordion({ faqs }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {faqs.map((faq) => {
        const isOpen = openId === faq.id
        return (
          <div
            key={faq.id}
            style={{
              background: "#ffffff",
              borderRadius: "10px",
              border: `1px solid ${isOpen ? primary[200] : "#e8ddd4"}`,
              overflow: "hidden",
              transition: "border-color 200ms",
            }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              style={{
                width: "100%",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: earth[700],
                  flex: 1,
                }}
              >
                {faq.question}
              </span>
              <span
                style={{
                  fontSize: "1.25rem",
                  color: primary[500],
                  flexShrink: 0,
                  transition: "transform 200ms",
                  transform: isOpen ? "rotate(45deg)" : "none",
                  display: "inline-block",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </button>
            {isOpen && (
              <div
                style={{
                  padding: "0 20px 18px",
                  fontFamily: fonts.body,
                  fontSize: "0.9375rem",
                  color: earth[500],
                  lineHeight: 1.7,
                }}
              >
                {faq.answer}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface Props {
  config?: ContactConfig | null
}

export function ContactPage({ config: propConfig }: Props) {
  const [config, setConfig] = useState<ContactConfig>(propConfig ?? DEFAULT_CONTACT_CONFIG)
  const [open, setOpen] = useState(isCurrentlyOpen())

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [message, setMessage] = useState("")
  const [formState, setFormState] = useState<FormState>("idle")
  const [formError, setFormError] = useState("")

  useEffect(() => {
    if (propConfig) return
    fetch(`${BACKEND_URL}/store/page-config`, {
      headers: { "x-publishable-api-key": PK },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.contact_config) {
          setConfig({ ...DEFAULT_CONTACT_CONFIG, ...data.contact_config })
        }
      })
      .catch(() => {})
  }, [propConfig])

  // Update open status every minute
  useEffect(() => {
    const id = setInterval(() => setOpen(isCurrentlyOpen()), 60000)
    return () => clearInterval(id)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError("Please fill in all required fields.")
      return
    }
    setFormError("")
    setFormState("sending")
    try {
      const res = await fetch(`${BACKEND_URL}/store/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PK,
        },
        body: JSON.stringify({ name, email, phone, subject, message }),
      })
      const data = await res.json()
      if (data.success) {
        setFormState("success")
        setName("")
        setEmail("")
        setPhone("")
        setMessage("")
        setSubject(SUBJECTS[0])
      } else {
        setFormState("error")
        setFormError(data.error || "Failed to send message. Please try again.")
      }
    } catch {
      setFormState("error")
      setFormError("Network error. Please try again.")
    }
  }

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact VastuCart",
    url: "https://store.vastucart.in/contact",
    description: "Get in touch with VastuCart for support, wholesale, or Vastu consultations.",
    mainEntity: {
      "@type": "Organization",
      name: "VastuCart",
      telephone: config.phone,
      email: config.email,
      address: {
        "@type": "PostalAddress",
        streetAddress: "42 Temple Lane",
        addressLocality: "Varanasi",
        addressRegion: "Uttar Pradesh",
        postalCode: "221001",
        addressCountry: "IN",
      },
    },
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: `1px solid ${earth[300]}`,
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: fonts.body,
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
    color: earth[700],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />

      {/* ── Section 1: Hero ─────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "360px",
          background: "linear-gradient(135deg, #013f47 0%, #054348 60%, #1a5c5c 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "72px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-60px",
            right: "-60px",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            background: "rgba(200,81,3,0.08)",
            pointerEvents: "none",
          }}
        />

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: secondary[300],
            textTransform: "uppercase",
            marginBottom: "16px",
            fontFamily: fonts.body,
          }}
        >
          SUPPORT
        </span>
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
            fontWeight: 700,
            color: "#ffffff",
            margin: "0 0 16px",
          }}
        >
          Get In Touch
        </h1>
        <p
          style={{
            fontFamily: fonts.body,
            fontSize: "1.0625rem",
            color: "rgba(255,255,255,0.8)",
            margin: "0 0 24px",
            maxWidth: "480px",
            lineHeight: 1.7,
          }}
        >
          We&rsquo;re here to help. Reach out and we&rsquo;ll respond within 24 hours.
        </p>

        {/* Live status indicator */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "20px",
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: open ? "#10B981" : "#6b7280",
              display: "inline-block",
              boxShadow: open ? "0 0 6px #10B981" : "none",
            }}
          />
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: "0.8125rem",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 600,
            }}
          >
            {open ? "Currently Open" : "Currently Closed"}
          </span>
        </div>

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

      {/* ── Section 2: Contact Methods Grid ───────────────────────────────── */}
      <section style={{ background: bg.primary, padding: "56px 24px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
          }}
        >
          {/* Phone */}
          <a
            href={`tel:${config.phone.replace(/\s/g, "")}`}
            style={{ textDecoration: "none" }}
          >
            <ContactCard
              icon="📞"
              iconBg={primary[500]}
              title="Call Us"
              value={config.phone}
              cta="Call Now"
            />
          </a>

          {/* Email */}
          <a href={`mailto:${config.email}`} style={{ textDecoration: "none" }}>
            <ContactCard
              icon="✉️"
              iconBg={secondary[500]}
              title="Email Support"
              value={config.email}
              cta="Send Email"
            />
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <ContactCard
              icon="💬"
              iconBg="#25D366"
              title="Chat on WhatsApp"
              value={config.whatsapp}
              cta="Open WhatsApp"
            />
          </a>

          {/* Book Consultation */}
          <Link href="/account/bookings" style={{ textDecoration: "none" }}>
            <ContactCard
              icon="📅"
              iconBg={earth[600]}
              title="Book Consultation"
              value="Schedule a Vastu call"
              cta="Book Now"
            />
          </Link>
        </div>
      </section>

      {/* ── Section 3: Form + Info ─────────────────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "72px 24px" }}>
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr",
            gap: "56px",
          }}
          className="contact-form-grid"
        >
          {/* Left: Contact Form */}
          <div>
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: primary[900],
                margin: "0 0 8px",
              }}
            >
              Send Us a Message
            </h2>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: "0.9375rem",
                color: earth[500],
                margin: "0 0 32px",
              }}
            >
              Fill out the form and we&rsquo;ll get back to you within 24 hours.
            </p>

            {formState === "success" ? (
              <div
                style={{
                  padding: "32px",
                  background: "#D1FAE5",
                  borderRadius: "12px",
                  textAlign: "center",
                  border: "1px solid #6EE7B7",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>✓</div>
                <h3
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "1.25rem",
                    color: "#065F46",
                    margin: "0 0 8px",
                  }}
                >
                  Message Sent!
                </h3>
                <p
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "0.9375rem",
                    color: "#047857",
                    margin: "0 0 20px",
                  }}
                >
                  We&rsquo;ve received your message and will respond within 24 hours.
                </p>
                <button
                  onClick={() => setFormState("idle")}
                  style={{
                    padding: "10px 24px",
                    background: primary[500],
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: fonts.body,
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                  className="contact-name-grid"
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: fonts.body,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: earth[700],
                        marginBottom: "6px",
                      }}
                    >
                      Full Name <span style={{ color: secondary[500] }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                      required
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: fonts.body,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: earth[700],
                        marginBottom: "6px",
                      }}
                    >
                      Email <span style={{ color: secondary[500] }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                      required
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                  className="contact-name-grid"
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: fonts.body,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: earth[700],
                        marginBottom: "6px",
                      }}
                    >
                      Phone (optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontFamily: fonts.body,
                        fontSize: "13px",
                        fontWeight: 600,
                        color: earth[700],
                        marginBottom: "6px",
                      }}
                    >
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer" }}
                      onFocus={(e) => (e.target.style.borderColor = primary[400])}
                      onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontFamily: fonts.body,
                      fontSize: "13px",
                      fontWeight: 600,
                      color: earth[700],
                      marginBottom: "6px",
                    }}
                  >
                    Message <span style={{ color: secondary[500] }}>*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help you?"
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "120px",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = primary[400])}
                    onBlur={(e) => (e.target.style.borderColor = earth[300])}
                    required
                  />
                </div>

                {formError && (
                  <p
                    style={{
                      fontFamily: fonts.body,
                      fontSize: "13px",
                      color: "#EF4444",
                      margin: "0 0 16px",
                      padding: "10px 14px",
                      background: "#FEE2E2",
                      borderRadius: "6px",
                    }}
                  >
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formState === "sending"}
                  style={{
                    padding: "13px 32px",
                    background:
                      formState === "sending"
                        ? earth[400]
                        : `linear-gradient(135deg, ${secondary[500]}, ${secondary[400]})`,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontFamily: fonts.body,
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: formState === "sending" ? "not-allowed" : "pointer",
                    transition: "all 200ms",
                  }}
                >
                  {formState === "sending" ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Right: Info */}
          <div style={{ display: "grid", gap: "20px", alignContent: "start" }}>
            {/* Working Hours */}
            <div
              style={{
                padding: "24px",
                background: bg.primary,
                borderRadius: "12px",
                border: `1px solid ${primary[100]}`,
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: primary[900],
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                🕐 Working Hours
              </h3>
              <div style={{ display: "grid", gap: "8px" }}>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "0.9rem",
                    color: earth[600],
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{config.workingHours.weekdays}</span>
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "0.9rem",
                    color: earth[500],
                  }}
                >
                  {config.workingHours.weekends}
                </div>
              </div>
            </div>

            {/* Address */}
            <div
              style={{
                padding: "24px",
                background: bg.primary,
                borderRadius: "12px",
                border: `1px solid ${primary[100]}`,
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: primary[900],
                  margin: "0 0 12px",
                }}
              >
                📍 Office Address
              </h3>
              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.9rem",
                  color: earth[600],
                  margin: 0,
                  lineHeight: 1.7,
                }}
              >
                {config.address}
              </p>
            </div>

            {/* Wholesale */}
            <div
              style={{
                padding: "24px",
                background: `linear-gradient(135deg, ${primary[50]}, #ffffff)`,
                borderRadius: "12px",
                border: `1px solid ${primary[100]}`,
              }}
            >
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: primary[900],
                  margin: "0 0 8px",
                }}
              >
                🏭 Wholesale Inquiries
              </h3>
              <p
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.875rem",
                  color: earth[500],
                  margin: "0 0 10px",
                }}
              >
                For bulk orders and wholesale partnerships:
              </p>
              <a
                href={`mailto:${config.wholesaleEmail}`}
                style={{
                  fontFamily: fonts.body,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: secondary[500],
                  textDecoration: "none",
                }}
              >
                {config.wholesaleEmail}
              </a>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .contact-form-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 560px) {
            .contact-name-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>

      {/* ── Section 4: FAQ Accordion ──────────────────────────────────────── */}
      <section style={{ background: bg.primary, padding: "72px 24px" }}>
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "1.75rem",
                fontWeight: 700,
                color: primary[900],
                margin: "0 0 12px",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              style={{
                fontFamily: fonts.body,
                fontSize: "1rem",
                color: earth[500],
                margin: 0,
              }}
            >
              Quick answers to the questions we hear most often.
            </p>
          </div>
          <FaqAccordion faqs={config.faqs} />
        </div>
      </section>

      {/* ── Section 5: Grievance Officer ──────────────────────────────────── */}
      <section
        style={{
          background: "#f9f6f3",
          padding: "48px 24px",
          borderTop: `1px solid ${earth[300]}30`,
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: fonts.heading,
              fontSize: "1.125rem",
              fontWeight: 700,
              color: earth[700],
              margin: "0 0 8px",
            }}
          >
            Grievance Redressal
          </h2>
          <p
            style={{
              fontFamily: fonts.body,
              fontSize: "0.8125rem",
              color: earth[500],
              margin: "0 0 16px",
              lineHeight: 1.6,
            }}
          >
            As per the Information Technology Act, 2000 and the Consumer Protection (E-Commerce)
            Rules, 2020, the Grievance Officer details are provided below. Grievances will be
            acknowledged within 48 hours and resolved within 30 days.
          </p>
          <div
            style={{
              padding: "16px 20px",
              background: "#ffffff",
              borderRadius: "8px",
              border: `1px solid ${earth[300]}40`,
              display: "grid",
              gap: "6px",
            }}
          >
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: "0.875rem",
                color: earth[600],
              }}
            >
              <strong style={{ color: earth[700] }}>Name:</strong>{" "}
              {config.grievanceOfficer.name}
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: "0.875rem",
                color: earth[600],
              }}
            >
              <strong style={{ color: earth[700] }}>Email:</strong>{" "}
              <a
                href={`mailto:${config.grievanceOfficer.email}`}
                style={{ color: primary[500], textDecoration: "none" }}
              >
                {config.grievanceOfficer.email}
              </a>
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: "0.875rem",
                color: earth[600],
              }}
            >
              <strong style={{ color: earth[700] }}>Address:</strong>{" "}
              {config.grievanceOfficer.address}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

// ── Contact Card ─────────────────────────────────────────────────────────────

interface ContactCardProps {
  icon: string
  iconBg: string
  title: string
  value: string
  cta: string
}

function ContactCard({ icon, iconBg, title, value, cta }: ContactCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "28px 24px",
        boxShadow: shadows.card,
        transition: "box-shadow 200ms, transform 200ms",
        cursor: "pointer",
        height: "100%",
        borderTop: "4px solid transparent",
        backgroundImage: `linear-gradient(#ffffff, #ffffff) padding-box, ${gradients.accentBorder} border-box`,
        backgroundOrigin: "border-box",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = "0 10px 24px rgba(1,63,71,0.12)"
        el.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = shadows.card
        el.style.transform = "none"
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.375rem",
          marginBottom: "16px",
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontFamily: fonts.heading,
          fontSize: "1.0625rem",
          fontWeight: 700,
          color: primary[900],
          marginBottom: "6px",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: fonts.body,
          fontSize: "0.9rem",
          color: earth[600],
          marginBottom: "14px",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: "0.875rem",
          fontWeight: 700,
          color: secondary[500],
        }}
      >
        {cta} →
      </span>
    </div>
  )
}
