"use client"

import { useState } from "react"
import {
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Megaphone,
  Edit2,
  Save,
  X,
  Check,
  Eye,
  EyeOff,
  Plus,
  Link2,
  ExternalLink,
} from "lucide-react"
import { primary, secondary, earth, bg, fonts } from "@/lib/theme"
import type {
  AdminNotificationsProps,
  ChannelTab,
  EmailTemplate,
  ChannelTemplate,
  SMSConfig,
  WhatsAppConfig,
  PushConfig,
  InAppAnnouncement,
  AnnouncementType,
  TargetAudience,
  NotificationsIntegrationConfig,
} from "@/types/admin-notifications"
import { ThemeSelect } from "@/components/ui/ThemeSelect"

const c = {
  primary500: primary[500],
  primary400: primary[400],
  primary200: primary[200],
  primary100: primary[100],
  primary50: primary[50],
  secondary500: secondary[500],
  secondary50: "#fff5ed",
  bg: bg.primary,
  card: "#ffffff",
  earth300: earth[300],
  earth400: earth[400],
  earth500: earth[500],
  earth600: earth[600],
  earth700: earth[700],
  success: "#10B981",
  successLight: "#D1FAE5",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  gradient: `linear-gradient(90deg, ${primary[500]}, ${primary[400]}, ${secondary[500]})`,
  shadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
}

const channelTabs: { id: ChannelTab; label: string; icon: typeof Mail }[] = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "SMS", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "push", label: "Push", icon: Bell },
  { id: "inapp", label: "In-App", icon: Megaphone },
]

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle?: () => void
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: "relative",
        display: "inline-flex",
        height: "1.5rem",
        width: "2.75rem",
        alignItems: "center",
        borderRadius: "9999px",
        backgroundColor: enabled ? c.success : c.earth300,
        transition: "background-color 0.2s",
        flexShrink: 0,
        border: "none",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "1rem",
          height: "1rem",
          borderRadius: "9999px",
          backgroundColor: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          transition: "transform 0.2s",
          transform: enabled ? "translateX(24px)" : "translateX(4px)",
        }}
      />
    </button>
  )
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`gradient-border-top ${className}`}
      style={{
        background: c.card,
        borderRadius: "0.75rem",
        boxShadow: c.shadow,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "1.5rem" }}>{children}</div>
    </div>
  )
}

/* ─── EMAIL TAB ─── */

function EmailTemplateCard({
  template,
  onToggle,
  onEdit,
}: {
  template: EmailTemplate
  onToggle?: () => void
  onEdit?: (subject: string, body: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body || "")

  return (
    <div
      style={{
        borderRadius: "0.5rem",
        border: `1px solid ${c.earth300}`,
        padding: "1rem",
        backgroundColor: c.card,
        transition: "all 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "0.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontFamily: fonts.heading,
              color: c.earth700,
              fontWeight: 600,
              margin: 0,
            }}
          >
            {template.name}
          </h4>
          <p
            style={{
              color: c.earth500,
              fontFamily: fonts.body,
              fontSize: "0.875rem",
              marginTop: "0.25rem",
              marginBottom: 0,
            }}
          >
            {template.description}
          </p>
        </div>
        <ToggleSwitch enabled={template.isActive} onToggle={onToggle} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginTop: "0.75rem",
          marginBottom: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.125rem 0.5rem",
            borderRadius: "9999px",
            backgroundColor: c.primary50,
            color: c.primary500,
            fontFamily: fonts.body,
          }}
        >
          {template.triggerEvent}
        </span>
        <span
          style={{
            color: c.earth500,
            fontFamily: fonts.body,
            fontSize: "0.75rem",
          }}
        >
          Edited {template.lastEdited}
        </span>
      </div>

      {!editing && (
        <p
          style={{
            color: c.earth600,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: "0.75rem",
          }}
        >
          Subject: {template.subject}
        </p>
      )}

      {editing ? (
        <div style={{ marginTop: "0.75rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: c.earth600,
                fontFamily: fonts.body,
                marginBottom: "0.25rem",
              }}
            >
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: `1px solid ${c.earth300}`,
                fontSize: "0.875rem",
                color: c.earth700,
                fontFamily: fonts.body,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: c.earth600,
                fontFamily: fonts.body,
                marginBottom: "0.25rem",
              }}
            >
              Email Body (HTML or plain text)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Enter HTML or plain text email body..."
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: `1px solid ${c.earth300}`,
                fontSize: "0.8125rem",
                color: c.earth700,
                fontFamily: fonts.body,
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                fontSize: "0.75rem",
                color: c.earth500,
                fontFamily: fonts.body,
                marginTop: "0.25rem",
              }}
            >
              Variables: {"{{customer_name}}"} {"{{order_id}}"} {"{{store_name}}"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                onEdit?.(subject, body)
                setEditing(false)
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: c.primary500,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: c.earth300,
                color: c.earth700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{
            padding: "0.375rem 0.75rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: c.primary50,
            color: c.primary500,
            border: `1px solid ${c.primary200}`,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Edit2 size={14} />
          Edit Template
        </button>
      )}
    </div>
  )
}

function EmailTab({
  templates,
  onToggle,
  onEdit,
}: {
  templates: EmailTemplate[]
  onToggle?: (id: string) => void
  onEdit?: (id: string, subject: string, body: string) => void
}) {
  return (
    <Card>
      <h3
        style={{
          fontFamily: fonts.heading,
          color: c.earth700,
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1rem",
          marginTop: 0,
        }}
      >
        Email Templates
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: c.earth500,
          fontFamily: fonts.body,
          marginBottom: "1rem",
        }}
      >
        Configure SMTP via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
        SMTP_FROM, SMTP_SECURE
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
          gap: "1rem",
        }}
      >
        {templates.map((tpl) => (
          <EmailTemplateCard
            key={tpl.id}
            template={tpl}
            onToggle={() => onToggle?.(tpl.id)}
            onEdit={(subject, body) => onEdit?.(tpl.id, subject, body)}
          />
        ))}
      </div>
    </Card>
  )
}

/* ─── CHANNEL CONFIG (SMS / WhatsApp / Push) ─── */

function MaskedInput({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  readOnly?: boolean
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.875rem",
          fontWeight: 500,
          color: c.earth600,
          fontFamily: fonts.body,
          marginBottom: "0.25rem",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={revealed ? "text" : "password"}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{
            width: "100%",
            padding: "0.5rem 2.5rem 0.5rem 0.75rem",
            borderRadius: "0.5rem",
            border: `1px solid ${c.earth300}`,
            fontSize: "0.875rem",
            color: c.earth700,
            fontFamily: revealed ? "monospace" : fonts.body,
            boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: c.earth500,
            border: "none",
            background: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function ChannelTemplateRow({
  tpl,
  onToggle,
  onEditTemplate,
  channelType,
}: {
  tpl: ChannelTemplate
  onToggle?: () => void
  onEditTemplate?: (id: string, template: string) => void
  channelType: "sms" | "whatsapp" | "push"
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(tpl.template)

  const charLimit = channelType === "sms" ? 160 : undefined
  const variableHints: Record<string, string[]> = {
    sms: [
      "{{customer_name}}",
      "{{order_id}}",
      "{{amount}}",
      "{{tracking_url}}",
      "{{otp}}",
    ],
    whatsapp: [
      "{{customer_name}}",
      "{{order_id}}",
      "{{amount}}",
      "{{tracking_url}}",
      "{{store_name}}",
      "{{delivery_date}}",
    ],
    push: [
      "{{customer_name}}",
      "{{product_name}}",
      "{{discount}}",
      "{{order_status}}",
      "{{order_id}}",
    ],
  }

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        border: `1px solid ${c.earth300}`,
        marginBottom: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              color: c.earth700,
              fontFamily: fonts.body,
              fontWeight: 500,
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            {tpl.name}
          </p>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              marginTop: "0.25rem",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: c.primary50,
              color: c.primary500,
              fontFamily: fonts.body,
            }}
          >
            {tpl.triggerEvent}
          </span>
        </div>
        <ToggleSwitch enabled={tpl.isActive} onToggle={onToggle} />
      </div>

      {editing ? (
        <div style={{ marginTop: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.75rem",
              fontWeight: 500,
              color: c.earth600,
              fontFamily: fonts.body,
              marginBottom: "0.25rem",
            }}
          >
            {channelType === "whatsapp" ? "Meta-Approved Template" : "Template Body"}
          </label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={channelType === "sms" ? 3 : 5}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: `1px solid ${c.earth300}`,
              fontSize: "0.8125rem",
              color: c.earth700,
              fontFamily: "monospace",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          {charLimit && (
            <p
              style={{
                fontSize: "0.75rem",
                marginTop: "0.25rem",
                fontFamily: "monospace",
                color: draft.length > charLimit ? c.error : c.earth500,
              }}
            >
              {draft.length}/{charLimit} characters
            </p>
          )}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.25rem",
              marginTop: "0.5rem",
              marginBottom: "0.75rem",
              alignItems: "center",
            }}
          >
            <span
              style={{
                color: c.earth500,
                fontFamily: fonts.body,
                fontSize: "0.75rem",
                marginRight: "0.25rem",
              }}
            >
              Variables:
            </span>
            {variableHints[channelType].map((v) => (
              <button
                key={v}
                onClick={() => setDraft((prev) => prev + " " + v)}
                style={{
                  fontSize: "0.75rem",
                  padding: "0.125rem 0.375rem",
                  borderRadius: "0.25rem",
                  backgroundColor: c.primary50,
                  color: c.primary500,
                  fontFamily: "monospace",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                onEditTemplate?.(tpl.id, draft)
                setEditing(false)
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: c.primary500,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <Save size={14} />
              Save
            </button>
            <button
              onClick={() => {
                setDraft(tpl.template)
                setEditing(false)
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                backgroundColor: c.earth300,
                color: c.earth700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
              }}
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p
            style={{
              color: c.earth500,
              fontFamily: "monospace",
              fontSize: "0.75rem",
              marginTop: "0.5rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {tpl.template}
          </p>
          <button
            onClick={() => setEditing(true)}
            style={{
              marginTop: "0.75rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor: c.primary50,
              color: c.primary500,
              border: `1px solid ${c.primary200}`,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <Edit2 size={14} />
            Edit Template
          </button>
        </>
      )}
    </div>
  )
}

function SMSTab({
  config,
  onToggle,
  onSave,
  onToggleTemplate,
  onEditTemplate,
}: {
  config: SMSConfig
  onToggle?: (enabled: boolean) => void
  onSave?: (config: SMSConfig) => void
  onToggleTemplate?: (id: string) => void
  onEditTemplate?: (id: string, template: string) => void
}) {
  const [senderId, setSenderId] = useState(config.senderId)

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: fonts.heading,
            color: c.earth700,
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          SMS Notifications
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              color: c.earth500,
              fontFamily: fonts.body,
              fontSize: "0.875rem",
            }}
          >
            {config.isEnabled ? "Enabled" : "Disabled"}
          </span>
          <ToggleSwitch
            enabled={config.isEnabled}
            onToggle={() => onToggle?.(!config.isEnabled)}
          />
        </div>
      </div>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: c.bg,
        }}
      >
        <p
          style={{
            color: c.earth600,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
            marginTop: 0,
          }}
        >
          Provider:{" "}
          <span style={{ color: c.primary500 }}>{config.provider.toUpperCase()}</span>
        </p>
        <p
          style={{
            color: c.earth500,
            fontFamily: fonts.body,
            fontSize: "0.8125rem",
            marginBottom: "0.75rem",
            marginTop: 0,
          }}
        >
          Configure Twilio credentials via env vars:{" "}
          <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code>
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: c.earth600,
              fontFamily: fonts.body,
              marginBottom: "0.25rem",
            }}
          >
            Sender ID / Phone Number
          </label>
          <input
            type="text"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            placeholder="+1234567890"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: `1px solid ${c.earth300}`,
              fontSize: "0.875rem",
              color: c.earth700,
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => onSave?.({ ...config, senderId })}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: c.primary500,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Save size={14} />
          Save Config
        </button>
      </div>

      <h4
        style={{
          fontFamily: fonts.heading,
          color: c.earth700,
          fontWeight: 600,
          marginBottom: "0.75rem",
          marginTop: 0,
        }}
      >
        SMS Templates
      </h4>
      {config.templates.map((tpl) => (
        <ChannelTemplateRow
          key={tpl.id}
          tpl={tpl}
          channelType="sms"
          onToggle={() => onToggleTemplate?.(tpl.id)}
          onEditTemplate={(id, template) => onEditTemplate?.(id, template)}
        />
      ))}
    </Card>
  )
}

function WhatsAppTab({
  config,
  onToggle,
  onSave,
  onToggleTemplate,
  onEditTemplate,
}: {
  config: WhatsAppConfig
  onToggle?: (enabled: boolean) => void
  onSave?: (config: WhatsAppConfig) => void
  onToggleTemplate?: (id: string) => void
  onEditTemplate?: (id: string, template: string) => void
}) {
  const [phoneNumber, setPhoneNumber] = useState(config.phoneNumber)

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: fonts.heading,
            color: c.earth700,
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          WhatsApp Notifications
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              color: c.earth500,
              fontFamily: fonts.body,
              fontSize: "0.875rem",
            }}
          >
            {config.isEnabled ? "Enabled" : "Disabled"}
          </span>
          <ToggleSwitch
            enabled={config.isEnabled}
            onToggle={() => onToggle?.(!config.isEnabled)}
          />
        </div>
      </div>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: c.bg,
        }}
      >
        <p
          style={{
            color: c.earth600,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.5rem",
            marginTop: 0,
          }}
        >
          Provider:{" "}
          <span style={{ color: c.primary500 }}>{config.provider}</span>
        </p>
        <p
          style={{
            color: c.earth500,
            fontFamily: fonts.body,
            fontSize: "0.8125rem",
            marginBottom: "0.75rem",
            marginTop: 0,
          }}
        >
          Configure via env vars:{" "}
          <code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>
        </p>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: c.earth600,
              fontFamily: fonts.body,
              marginBottom: "0.25rem",
            }}
          >
            Business Phone Number (E.164)
          </label>
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+911234567890"
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: `1px solid ${c.earth300}`,
              fontSize: "0.875rem",
              color: c.earth700,
              fontFamily: "monospace",
              boxSizing: "border-box",
            }}
          />
        </div>
        <button
          onClick={() => onSave?.({ ...config, phoneNumber })}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: c.primary500,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Save size={14} />
          Save Config
        </button>
      </div>

      <h4
        style={{
          fontFamily: fonts.heading,
          color: c.earth700,
          fontWeight: 600,
          marginBottom: "0.75rem",
          marginTop: 0,
        }}
      >
        WhatsApp Templates
      </h4>
      {config.templates.map((tpl) => (
        <ChannelTemplateRow
          key={tpl.id}
          tpl={tpl}
          channelType="whatsapp"
          onToggle={() => onToggleTemplate?.(tpl.id)}
          onEditTemplate={(id, template) => onEditTemplate?.(id, template)}
        />
      ))}
    </Card>
  )
}

function PushTab({
  config,
  onToggle,
  onSave,
  onToggleTemplate,
  onEditTemplate,
}: {
  config: PushConfig
  onToggle?: (enabled: boolean) => void
  onSave?: (config: PushConfig) => void
  onToggleTemplate?: (id: string) => void
  onEditTemplate?: (id: string, template: string) => void
}) {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: fonts.heading,
            color: c.earth700,
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          Push Notifications
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            style={{
              color: c.earth500,
              fontFamily: fonts.body,
              fontSize: "0.875rem",
            }}
          >
            {config.isEnabled ? "Enabled" : "Disabled"}
          </span>
          <ToggleSwitch
            enabled={config.isEnabled}
            onToggle={() => onToggle?.(!config.isEnabled)}
          />
        </div>
      </div>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: c.bg,
        }}
      >
        <p
          style={{
            color: c.earth500,
            fontFamily: fonts.body,
            fontSize: "0.8125rem",
            marginBottom: "0.75rem",
            marginTop: 0,
          }}
        >
          Generate VAPID keys with:{" "}
          <code>npx web-push generate-vapid-keys</code>
          <br />
          Set env vars: <code>VAPID_PUBLIC_KEY</code>, <code>VAPID_PRIVATE_KEY</code>,{" "}
          <code>VAPID_SUBJECT</code>
        </p>
        <MaskedInput
          label="VAPID Public Key (display only)"
          value={config.vapidPublicKey}
          readOnly
          placeholder="Set VAPID_PUBLIC_KEY env var"
        />
        <button
          onClick={() => onSave?.(config)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: c.primary500,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          <Save size={14} />
          Save Config
        </button>
      </div>

      <h4
        style={{
          fontFamily: fonts.heading,
          color: c.earth700,
          fontWeight: 600,
          marginBottom: "0.75rem",
          marginTop: 0,
        }}
      >
        Push Templates
      </h4>
      {config.templates.map((tpl) => (
        <ChannelTemplateRow
          key={tpl.id}
          tpl={tpl}
          channelType="push"
          onToggle={() => onToggleTemplate?.(tpl.id)}
          onEditTemplate={(id, template) => onEditTemplate?.(id, template)}
        />
      ))}
    </Card>
  )
}

/* ─── IN-APP TAB ─── */

function AnnouncementRow({
  announcement,
  onToggle,
}: {
  announcement: InAppAnnouncement
  onToggle?: () => void
}) {
  const typeColors: Record<AnnouncementType, { bg: string; text: string }> = {
    banner: { bg: c.primary50, text: c.primary500 },
    modal: { bg: c.secondary50, text: c.secondary500 },
    toast: { bg: c.warningLight, text: c.warning },
  }
  const tc = typeColors[announcement.type]

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "0.5rem",
        border: `1px solid ${c.earth300}`,
        marginBottom: "0.75rem",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          <h4
            style={{
              color: c.earth700,
              fontFamily: fonts.heading,
              fontWeight: 600,
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            {announcement.title}
          </h4>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              textTransform: "capitalize",
              backgroundColor: tc.bg,
              color: tc.text,
              fontFamily: fonts.body,
            }}
          >
            {announcement.type}
          </span>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              backgroundColor: c.bg,
              color: c.earth500,
              fontFamily: fonts.body,
            }}
          >
            {announcement.targetAudience}
          </span>
        </div>
        <p
          style={{
            color: c.earth500,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
            marginTop: "0.25rem",
            marginBottom: 0,
          }}
        >
          {announcement.message}
        </p>
        <p
          style={{
            color: c.earth400,
            fontFamily: "monospace",
            fontSize: "0.75rem",
            marginTop: "0.5rem",
            marginBottom: 0,
          }}
        >
          {announcement.startDate || "now"} — {announcement.endDate || "indefinite"}
        </p>
      </div>
      <ToggleSwitch enabled={announcement.isActive} onToggle={onToggle} />
    </div>
  )
}

function InAppTab({
  announcements,
  onToggle,
  onCreate,
}: {
  announcements: InAppAnnouncement[]
  onToggle?: (id: string) => void
  onCreate?: (announcement: Omit<InAppAnnouncement, "id">) => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [audience, setAudience] = useState<TargetAudience>("all")
  const [type, setType] = useState<AnnouncementType>("banner")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const handleCreate = () => {
    if (!title || !message) return
    onCreate?.({ title, message, targetAudience: audience, type, startDate, endDate, isActive: true })
    setTitle("")
    setMessage("")
    setStartDate("")
    setEndDate("")
    setShowForm(false)
  }

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "0.5rem",
    border: `1px solid ${c.earth300}`,
    fontSize: "0.875rem",
    color: c.earth700,
    fontFamily: fonts.body,
    boxSizing: "border-box" as const,
  }

  const labelStyle = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500 as const,
    color: c.earth600,
    fontFamily: fonts.body,
    marginBottom: "0.25rem",
  }

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
        }}
      >
        <h3
          style={{
            fontFamily: fonts.heading,
            color: c.earth700,
            fontSize: "1.25rem",
            fontWeight: 600,
            margin: 0,
          }}
        >
          In-App Announcements
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            backgroundColor: c.primary500,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? "Cancel" : "Create Announcement"}
        </button>
      </div>

      {showForm && (
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: c.bg,
            border: `1px solid ${c.earth300}`,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={inputStyle}
                placeholder="e.g. Free shipping this weekend!"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Announcement message shown to users..."
              />
            </div>
            <div>
              <label style={labelStyle}>Target Audience</label>
              <ThemeSelect
                value={audience}
                onChange={(v) => setAudience(v as TargetAudience)}
                options={[
                  { value: "all", label: "All Users" },
                  { value: "new", label: "New Users" },
                  { value: "returning", label: "Returning Users" },
                  { value: "vip", label: "VIP Users" },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>Display Type</label>
              <ThemeSelect
                value={type}
                onChange={(v) => setType(v as AnnouncementType)}
                options={[
                  { value: "banner", label: "Banner (top of page)" },
                  { value: "modal", label: "Modal (popup)" },
                  { value: "toast", label: "Toast (notification)" },
                ]}
              />
            </div>
            <div>
              <label style={labelStyle}>Start Date (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date (optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={!title || !message}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor: title && message ? c.primary500 : c.earth300,
              color: title && message ? "#fff" : c.earth600,
              border: "none",
              cursor: title && message ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <Check size={14} />
            Create
          </button>
        </div>
      )}

      {announcements.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: c.earth400,
            fontFamily: fonts.body,
            fontSize: "0.875rem",
          }}
        >
          No announcements yet. Create one to show banners, modals, or toasts on the
          storefront.
        </div>
      ) : (
        announcements.map((ann) => (
          <AnnouncementRow
            key={ann.id}
            announcement={ann}
            onToggle={() => onToggle?.(ann.id)}
          />
        ))
      )}
    </Card>
  )
}

/* ─── INTEGRATIONS SECTION ─── */

function IntegrationsSection({
  integrations,
  onSave,
}: {
  integrations: NotificationsIntegrationConfig
  onSave?: (integrations: NotificationsIntegrationConfig) => void
}) {
  const [listmonkUrl, setListmonkUrl] = useState(integrations.listmonk.url)
  const [chatwootUrl, setChatwootUrl] = useState(integrations.chatwoot.url)
  const [chatwootToken, setChatwootToken] = useState(integrations.chatwoot.widgetToken)

  return (
    <Card className="mt-6">
      <h3
        style={{
          fontFamily: fonts.heading,
          color: c.earth700,
          fontSize: "1.25rem",
          fontWeight: 600,
          marginBottom: "1.5rem",
          marginTop: 0,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Link2 size={20} style={{ color: c.primary500 }} />
        Integrations
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.5rem",
        }}
      >
        {/* Listmonk */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: c.bg,
            border: `1px solid ${c.earth300}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <h4
              style={{
                fontFamily: fonts.heading,
                color: c.earth700,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Listmonk
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: integrations.listmonk.isConnected
                    ? c.success
                    : c.error,
                }}
              />
              <span
                style={{
                  color: integrations.listmonk.isConnected ? c.success : c.error,
                  fontFamily: fonts.body,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                {integrations.listmonk.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: c.earth600,
              fontFamily: fonts.body,
              marginBottom: "0.25rem",
            }}
          >
            Instance URL
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={listmonkUrl}
              onChange={(e) => setListmonkUrl(e.target.value)}
              placeholder="https://your-listmonk-instance.com"
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: `1px solid ${c.earth300}`,
                fontSize: "0.875rem",
                color: c.earth700,
                fontFamily: "monospace",
                minWidth: 0,
              }}
            />
            {listmonkUrl && (
              <a
                href={listmonkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: c.primary50,
                  color: c.primary500,
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>

        {/* Chatwoot */}
        <div
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            backgroundColor: c.bg,
            border: `1px solid ${c.earth300}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <h4
              style={{
                fontFamily: fonts.heading,
                color: c.earth700,
                fontWeight: 600,
                margin: 0,
              }}
            >
              Chatwoot
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "0.5rem",
                  height: "0.5rem",
                  borderRadius: "9999px",
                  backgroundColor: integrations.chatwoot.isConnected
                    ? c.success
                    : c.error,
                }}
              />
              <span
                style={{
                  color: integrations.chatwoot.isConnected ? c.success : c.error,
                  fontFamily: fonts.body,
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                {integrations.chatwoot.isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: c.earth600,
              fontFamily: fonts.body,
              marginBottom: "0.25rem",
            }}
          >
            Instance URL
          </label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <input
              type="text"
              value={chatwootUrl}
              onChange={(e) => setChatwootUrl(e.target.value)}
              placeholder="https://app.chatwoot.com"
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: `1px solid ${c.earth300}`,
                fontSize: "0.875rem",
                color: c.earth700,
                fontFamily: "monospace",
                minWidth: 0,
              }}
            />
            {chatwootUrl && (
              <a
                href={chatwootUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.5rem",
                  borderRadius: "0.5rem",
                  backgroundColor: c.primary50,
                  color: c.primary500,
                  display: "flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
          <MaskedInput
            label="Widget Token"
            value={chatwootToken}
            onChange={setChatwootToken}
            placeholder="Enter widget token"
          />
        </div>
      </div>

      <button
        onClick={() =>
          onSave?.({
            listmonk: { url: listmonkUrl, isConnected: !!listmonkUrl },
            chatwoot: {
              url: chatwootUrl,
              isConnected: !!(chatwootUrl && chatwootToken),
              widgetToken: chatwootToken,
            },
          })
        }
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          fontWeight: 500,
          backgroundColor: c.primary500,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
        }}
      >
        <Save size={14} />
        Save Integration Settings
      </button>
    </Card>
  )
}

/* ─── MAIN COMPONENT ─── */

export function AdminNotifications({
  activeChannel,
  emailTemplates,
  smsConfig,
  whatsappConfig,
  pushConfig,
  inAppAnnouncements,
  integrations,
  onChangeChannel,
  onToggleEmailTemplate,
  onEditEmailTemplate,
  onToggleSMS,
  onSaveSMSConfig,
  onToggleSMSTemplate,
  onEditSMSTemplate,
  onToggleWhatsApp,
  onSaveWhatsAppConfig,
  onToggleWhatsAppTemplate,
  onEditWhatsAppTemplate,
  onTogglePush,
  onSavePushConfig,
  onTogglePushTemplate,
  onEditPushTemplate,
  onToggleAnnouncement,
  onCreateAnnouncement,
  onSaveIntegrations,
}: AdminNotificationsProps) {
  return (
    <div style={{ fontFamily: fonts.body }}>
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
        <h2
          style={{
            fontFamily: fonts.heading,
            color: c.earth700,
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            marginTop: 0,
          }}
        >
          Notifications & Communication
        </h2>

        {/* Channel Tabs */}
        <div
          style={{
            borderBottom: `1px solid ${c.earth300}`,
            marginBottom: "1.5rem",
            overflowX: "auto",
          }}
        >
          <div style={{ display: "flex", gap: "0.25rem", minWidth: "max-content" }}>
            {channelTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeChannel === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onChangeChannel?.(tab.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.625rem 1rem",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    color: isActive ? c.primary500 : c.earth500,
                    borderBottom: isActive
                      ? `2px solid ${c.primary500}`
                      : "2px solid transparent",
                    background: "none",
                    border: "none",
                    borderBottomWidth: "2px",
                    borderBottomStyle: "solid",
                    borderBottomColor: isActive ? c.primary500 : "transparent",
                    cursor: "pointer",
                    fontFamily: fonts.body,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Channel Content */}
        {activeChannel === "email" && (
          <EmailTab
            templates={emailTemplates}
            onToggle={onToggleEmailTemplate}
            onEdit={onEditEmailTemplate}
          />
        )}
        {activeChannel === "sms" && (
          <SMSTab
            config={smsConfig}
            onToggle={onToggleSMS}
            onSave={onSaveSMSConfig}
            onToggleTemplate={onToggleSMSTemplate}
            onEditTemplate={onEditSMSTemplate}
          />
        )}
        {activeChannel === "whatsapp" && (
          <WhatsAppTab
            config={whatsappConfig}
            onToggle={onToggleWhatsApp}
            onSave={onSaveWhatsAppConfig}
            onToggleTemplate={onToggleWhatsAppTemplate}
            onEditTemplate={onEditWhatsAppTemplate}
          />
        )}
        {activeChannel === "push" && (
          <PushTab
            config={pushConfig}
            onToggle={onTogglePush}
            onSave={onSavePushConfig}
            onToggleTemplate={onTogglePushTemplate}
            onEditTemplate={onEditPushTemplate}
          />
        )}
        {activeChannel === "inapp" && (
          <InAppTab
            announcements={inAppAnnouncements}
            onToggle={onToggleAnnouncement}
            onCreate={onCreateAnnouncement}
          />
        )}

        {/* Integrations always visible */}
        <IntegrationsSection integrations={integrations} onSave={onSaveIntegrations} />
      </div>
    </div>
  )
}
