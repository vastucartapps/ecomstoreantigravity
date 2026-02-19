"use client"

import { useEffect } from "react"
import { MessageCircle, Mail, Phone, Clock, ExternalLink } from "lucide-react"
import { primary, earth, bg, fonts, gradients } from "@/lib/theme"

const SUPPORT_INFO = {
  email: "support@vastucart.com",
  phone: "+91 98765 43210",
  whatsapp: "+91 98765 43210",
  hours: "Mon–Sat, 10:00 AM – 6:00 PM IST",
  responseTime: "We typically respond within 4 hours",
}

const FAQ_ITEMS = [
  {
    q: "How do I track my order?",
    a: "Go to My Orders and click on any order to see the tracking timeline. You'll also receive email updates.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns within 7 days of delivery for unused items in original packaging. Contact support to initiate.",
  },
  {
    q: "How are loyalty points earned?",
    a: "You earn 1 loyalty point for every ₹100 spent. Points are credited after order confirmation.",
  },
  {
    q: "Are all products authentic?",
    a: "Yes. All crystals, yantras, and rudraksha are sourced directly from certified suppliers with quality assurance.",
  },
  {
    q: "Can I change my delivery address after order?",
    a: "Address changes are possible only before the order is shipped. Contact support immediately.",
  },
]

export function SupportSection() {
  const chatwootToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN

  useEffect(() => {
    if (!chatwootToken) return
    // Load Chatwoot widget
    const w = window as any
    w.chatwootSettings = {
      position: "right",
      type: "expanded_bubble",
      launcherTitle: "Chat with us",
    }
    const script = document.createElement("script")
    script.src = "https://app.chatwoot.com/packs/js/sdk.js"
    script.defer = true
    script.async = true
    script.onload = () => {
      w.chatwootSDK?.run({
        websiteToken: chatwootToken,
        baseUrl: "https://app.chatwoot.com",
      })
    }
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [chatwootToken])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold" style={{ color: primary[900], fontFamily: fonts.heading }}>
          Help & Support
        </h1>
        <p className="text-sm mt-0.5" style={{ color: earth[400] }}>
          We're here to help you
        </p>
      </div>

      {/* Contact cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Mail,
            title: "Email Us",
            value: SUPPORT_INFO.email,
            href: `mailto:${SUPPORT_INFO.email}`,
            color: "#3B82F6",
            bg: "#EFF6FF",
          },
          {
            icon: Phone,
            title: "Call Us",
            value: SUPPORT_INFO.phone,
            href: `tel:${SUPPORT_INFO.phone.replace(/\s/g, "")}`,
            color: "#10B981",
            bg: "#ECFDF5",
          },
          {
            icon: MessageCircle,
            title: "WhatsApp",
            value: "Chat Now",
            href: `https://wa.me/${SUPPORT_INFO.whatsapp?.replace(/[+\s]/g, "")}`,
            color: "#25D366",
            bg: "#F0FDF4",
          },
        ].map((item) => {
          const Icon = item.icon
          return (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-5 rounded-2xl transition-shadow hover:shadow-md group"
              style={{ background: item.bg, border: `1px solid ${item.bg}`, textDecoration: "none" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: `${item.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: item.color }} />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold" style={{ color: earth[500] }}>{item.title}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            </a>
          )
        })}
      </div>

      {/* Hours & response */}
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: `${primary[50]}`, border: `1px solid ${primary[100]}` }}>
        <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: primary[500] }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: primary[700] }}>Support Hours</p>
          <p className="text-xs mt-0.5" style={{ color: earth[600] }}>{SUPPORT_INFO.hours}</p>
          <p className="text-xs mt-0.5" style={{ color: earth[400] }}>{SUPPORT_INFO.responseTime}</p>
        </div>
      </div>

      {/* Live chat CTA (if Chatwoot enabled) */}
      {chatwootToken ? (
        <div className="rounded-2xl p-5 text-white text-center" style={{ background: `linear-gradient(135deg, ${primary[500]}, #054348)` }}>
          <MessageCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-semibold mb-1">Live Chat Active</p>
          <p className="text-xs opacity-80">Click the chat bubble in the bottom right to connect with us instantly.</p>
        </div>
      ) : (
        <div className="rounded-2xl p-5 text-center" style={{ background: bg.card, border: "1px solid #f0ebe4" }}>
          <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: earth[200] }} />
          <p className="text-sm font-semibold" style={{ color: earth[600] }}>Live chat coming soon</p>
          <p className="text-xs mt-1" style={{ color: earth[400] }}>Meanwhile, reach us via email or WhatsApp</p>
        </div>
      )}

      {/* FAQ */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #f0ebe4" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #f0ebe4", background: bg.card }}>
          <h2 className="text-sm font-semibold" style={{ color: earth[700] }}>Frequently Asked Questions</h2>
        </div>
        <div style={{ background: bg.card }}>
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={idx}
              className="group"
              style={{ borderBottom: idx < FAQ_ITEMS.length - 1 ? "1px solid #f0ebe4" : "none" }}
            >
              <summary
                className="flex items-center justify-between px-5 py-4 cursor-pointer list-none"
                style={{ color: earth[700] }}
              >
                <span className="text-sm font-medium">{item.q}</span>
                <span className="text-lg text-gray-400 group-open:rotate-45 transition-transform" style={{ flexShrink: 0, marginLeft: 8 }}>+</span>
              </summary>
              <div className="px-5 pb-4">
                <p className="text-sm" style={{ color: earth[500] }}>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
