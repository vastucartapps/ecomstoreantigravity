import { adminFetch } from "@/lib/medusa"
import type {
  NotificationsConfig,
  EmailTemplate,
  SMSConfig,
  WhatsAppConfig,
  PushConfig,
  InAppAnnouncement,
  ChannelTemplate,
  NotificationsIntegrationConfig,
} from "@/types/admin-notifications"

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "order-placed",
    name: "Order Confirmation",
    subject: "Your order #{{order_id}} has been placed!",
    body: "<h2>Thank you, {{customer_name}}!</h2><p>Your order <strong>#{{order_id}}</strong> has been placed and is being processed.</p><p>We'll notify you when it ships.</p>",
    description: "Sent when a customer places an order",
    isActive: false,
    lastEdited: new Date().toISOString().slice(0, 10),
    triggerEvent: "order.placed",
  },
  {
    id: "order-shipped",
    name: "Order Shipped",
    subject: "Your order #{{order_id}} has been shipped!",
    body: "<h2>Great news, {{customer_name}}!</h2><p>Your order <strong>#{{order_id}}</strong> is on its way.</p>",
    description: "Sent when an order is fulfilled/shipped",
    isActive: false,
    lastEdited: new Date().toISOString().slice(0, 10),
    triggerEvent: "order.fulfillment_created",
  },
  {
    id: "order-delivered",
    name: "Order Delivered",
    subject: "Your order #{{order_id}} has been delivered!",
    body: "<h2>Delivered, {{customer_name}}!</h2><p>Your order <strong>#{{order_id}}</strong> has arrived. Enjoy!</p>",
    description: "Sent when an order is delivered",
    isActive: false,
    lastEdited: new Date().toISOString().slice(0, 10),
    triggerEvent: "order.delivery_created",
  },
  {
    id: "order-cancelled",
    name: "Order Cancelled",
    subject: "Your order #{{order_id}} has been cancelled",
    body: "<p>Hi {{customer_name}}, your order <strong>#{{order_id}}</strong> has been cancelled. If you have questions, please contact support.</p>",
    description: "Sent when an order is cancelled",
    isActive: false,
    lastEdited: new Date().toISOString().slice(0, 10),
    triggerEvent: "order.cancelled",
  },
]

const DEFAULT_SMS_TEMPLATES: ChannelTemplate[] = [
  {
    id: "sms-order-placed",
    name: "Order Confirmation",
    template:
      "Hi {{customer_name}}, your order #{{order_id}} is confirmed! Total: ₹{{amount}}. Thank you for shopping with {{store_name}}.",
    triggerEvent: "order.placed",
    isActive: true,
  },
  {
    id: "sms-order-shipped",
    name: "Order Shipped",
    template:
      "Great news {{customer_name}}! Your order #{{order_id}} has been shipped. Track it at {{tracking_url}}.",
    triggerEvent: "order.fulfillment_created",
    isActive: true,
  },
  {
    id: "sms-order-delivered",
    name: "Order Delivered",
    template:
      "Your order #{{order_id}} has been delivered. Enjoy your purchase! - {{store_name}}",
    triggerEvent: "order.delivery_created",
    isActive: true,
  },
]

const DEFAULT_WHATSAPP_TEMPLATES: ChannelTemplate[] = [
  {
    id: "wa-order-placed",
    name: "Order Confirmation",
    template:
      "Hello {{customer_name}}! 🎉\nYour order *#{{order_id}}* has been placed successfully.\nTotal: ₹{{amount}}\nWe'll notify you when it ships.\n\n— {{store_name}} Team",
    triggerEvent: "order.placed",
    isActive: true,
  },
  {
    id: "wa-order-shipped",
    name: "Order Shipped",
    template:
      "Your order *#{{order_id}}* has been shipped! 🚚\nExpected delivery: {{delivery_date}}\nTrack: {{tracking_url}}\n\n— {{store_name}}",
    triggerEvent: "order.fulfillment_created",
    isActive: true,
  },
  {
    id: "wa-order-delivered",
    name: "Order Delivered",
    template:
      "Your order *#{{order_id}}* has been delivered! ✅\nThank you for shopping with {{store_name}}. We hope you love it!",
    triggerEvent: "order.delivery_created",
    isActive: true,
  },
]

const DEFAULT_PUSH_TEMPLATES: ChannelTemplate[] = [
  {
    id: "push-order-placed",
    name: "Order Confirmed",
    template: "Your order #{{order_id}} is confirmed! Total: ₹{{amount}}.",
    triggerEvent: "order.placed",
    isActive: true,
  },
  {
    id: "push-order-shipped",
    name: "Order Shipped",
    template: "Your order #{{order_id}} has been shipped and is on the way!",
    triggerEvent: "order.fulfillment_created",
    isActive: true,
  },
  {
    id: "push-order-delivered",
    name: "Order Delivered",
    template: "Your order #{{order_id}} has been delivered. Enjoy!",
    triggerEvent: "order.delivery_created",
    isActive: true,
  },
]

const DEFAULT_CONFIG: NotificationsConfig = {
  emailTemplates: DEFAULT_EMAIL_TEMPLATES,
  smsConfig: {
    provider: "twilio",
    senderId: "",
    isEnabled: false,
    templates: DEFAULT_SMS_TEMPLATES,
  },
  whatsappConfig: {
    provider: "meta",
    phoneNumber: "",
    isEnabled: false,
    templates: DEFAULT_WHATSAPP_TEMPLATES,
  },
  pushConfig: {
    isEnabled: false,
    vapidPublicKey: "",
    templates: DEFAULT_PUSH_TEMPLATES,
  },
  inAppAnnouncements: [],
  integrations: {
    listmonk: { url: "", isConnected: false },
    chatwoot: { url: "", isConnected: false, widgetToken: "" },
  },
}

// ─── Store helpers ─────────────────────────────────────────────────────────────

async function readStore() {
  const data = await adminFetch("/admin/stores", {
    method: "GET",
  })
  return data?.stores?.[0] ?? null
}

async function writeConfig(config: NotificationsConfig) {
  const store = await readStore()
  if (!store) throw new Error("Store not found")
  await adminFetch(`/admin/stores/${store.id}`, {
    method: "POST",
    body: { metadata: { notifications_config: config } },
  })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminNotifications() {
  async function fetchConfig(): Promise<NotificationsConfig> {
    const store = await readStore()
    const saved = (store?.metadata as Record<string, unknown> | undefined)?.notifications_config as
      | NotificationsConfig
      | undefined

    if (!saved) return { ...DEFAULT_CONFIG }

    // Merge email templates: saved overrides defaults, new defaults always present
    const savedEmailMap = new Map(
      (saved.emailTemplates || []).map((t) => [t.id, t])
    )
    const mergedEmail = DEFAULT_EMAIL_TEMPLATES.map((def) =>
      savedEmailMap.has(def.id) ? (savedEmailMap.get(def.id) as EmailTemplate) : def
    )

    // Merge SMS templates
    const savedSmsMap = new Map(
      (saved.smsConfig?.templates || []).map((t: ChannelTemplate) => [t.id, t])
    )
    const mergedSms = DEFAULT_SMS_TEMPLATES.map((def) =>
      savedSmsMap.has(def.id) ? (savedSmsMap.get(def.id) as ChannelTemplate) : def
    )

    // Merge WhatsApp templates
    const savedWaMap = new Map(
      (saved.whatsappConfig?.templates || []).map((t: ChannelTemplate) => [t.id, t])
    )
    const mergedWa = DEFAULT_WHATSAPP_TEMPLATES.map((def) =>
      savedWaMap.has(def.id) ? (savedWaMap.get(def.id) as ChannelTemplate) : def
    )

    // Merge Push templates
    const savedPushMap = new Map(
      (saved.pushConfig?.templates || []).map((t: ChannelTemplate) => [t.id, t])
    )
    const mergedPush = DEFAULT_PUSH_TEMPLATES.map((def) =>
      savedPushMap.has(def.id) ? (savedPushMap.get(def.id) as ChannelTemplate) : def
    )

    return {
      emailTemplates: mergedEmail,
      smsConfig: {
        ...DEFAULT_CONFIG.smsConfig,
        ...(saved.smsConfig || {}),
        templates: mergedSms,
      },
      whatsappConfig: {
        ...DEFAULT_CONFIG.whatsappConfig,
        ...(saved.whatsappConfig || {}),
        templates: mergedWa,
      },
      pushConfig: {
        ...DEFAULT_CONFIG.pushConfig,
        ...(saved.pushConfig || {}),
        templates: mergedPush,
      },
      inAppAnnouncements: saved.inAppAnnouncements || [],
      integrations: {
        ...DEFAULT_CONFIG.integrations,
        ...(saved.integrations || {}),
      },
    }
  }

  // ── Email ──────────────────────────────────────────────────────────────────

  async function toggleEmailTemplate(
    id: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      emailTemplates: config.emailTemplates.map((t) =>
        t.id === id ? { ...t, isActive: !t.isActive } : t
      ),
    }
    await writeConfig(updated)
    return updated
  }

  async function editEmailTemplate(
    id: string,
    subject: string,
    body: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const now = new Date().toISOString().slice(0, 10)
    const updated: NotificationsConfig = {
      ...config,
      emailTemplates: config.emailTemplates.map((t) =>
        t.id === id ? { ...t, subject, body, lastEdited: now } : t
      ),
    }
    await writeConfig(updated)
    return updated
  }

  // ── SMS ────────────────────────────────────────────────────────────────────

  async function toggleSMS(
    enabled: boolean,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      smsConfig: { ...config.smsConfig, isEnabled: enabled },
    }
    await writeConfig(updated)
    return updated
  }

  async function saveSMSConfig(
    smsConfig: SMSConfig,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = { ...config, smsConfig }
    await writeConfig(updated)
    return updated
  }

  async function toggleSMSTemplate(
    id: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      smsConfig: {
        ...config.smsConfig,
        templates: config.smsConfig.templates.map((t) =>
          t.id === id ? { ...t, isActive: !t.isActive } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  async function editSMSTemplate(
    id: string,
    template: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      smsConfig: {
        ...config.smsConfig,
        templates: config.smsConfig.templates.map((t) =>
          t.id === id ? { ...t, template } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  // ── WhatsApp ───────────────────────────────────────────────────────────────

  async function toggleWhatsApp(
    enabled: boolean,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      whatsappConfig: { ...config.whatsappConfig, isEnabled: enabled },
    }
    await writeConfig(updated)
    return updated
  }

  async function saveWhatsAppConfig(
    whatsappConfig: WhatsAppConfig,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = { ...config, whatsappConfig }
    await writeConfig(updated)
    return updated
  }

  async function toggleWhatsAppTemplate(
    id: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      whatsappConfig: {
        ...config.whatsappConfig,
        templates: config.whatsappConfig.templates.map((t) =>
          t.id === id ? { ...t, isActive: !t.isActive } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  async function editWhatsAppTemplate(
    id: string,
    template: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      whatsappConfig: {
        ...config.whatsappConfig,
        templates: config.whatsappConfig.templates.map((t) =>
          t.id === id ? { ...t, template } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  // ── Push ───────────────────────────────────────────────────────────────────

  async function togglePush(
    enabled: boolean,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      pushConfig: { ...config.pushConfig, isEnabled: enabled },
    }
    await writeConfig(updated)
    return updated
  }

  async function savePushConfig(
    pushConfig: PushConfig,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = { ...config, pushConfig }
    await writeConfig(updated)
    return updated
  }

  async function togglePushTemplate(
    id: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      pushConfig: {
        ...config.pushConfig,
        templates: config.pushConfig.templates.map((t) =>
          t.id === id ? { ...t, isActive: !t.isActive } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  async function editPushTemplate(
    id: string,
    template: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      pushConfig: {
        ...config.pushConfig,
        templates: config.pushConfig.templates.map((t) =>
          t.id === id ? { ...t, template } : t
        ),
      },
    }
    await writeConfig(updated)
    return updated
  }

  // ── In-App Announcements ───────────────────────────────────────────────────

  async function toggleAnnouncement(
    id: string,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = {
      ...config,
      inAppAnnouncements: config.inAppAnnouncements.map((a) =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      ),
    }
    await writeConfig(updated)
    return updated
  }

  async function createAnnouncement(
    announcement: Omit<InAppAnnouncement, "id">,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const newItem: InAppAnnouncement = {
      ...announcement,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }
    const updated: NotificationsConfig = {
      ...config,
      inAppAnnouncements: [...config.inAppAnnouncements, newItem],
    }
    await writeConfig(updated)
    return updated
  }

  // ── Integrations ───────────────────────────────────────────────────────────

  async function saveIntegrations(
    integrations: NotificationsIntegrationConfig,
    config: NotificationsConfig
  ): Promise<NotificationsConfig> {
    const updated: NotificationsConfig = { ...config, integrations }
    await writeConfig(updated)
    return updated
  }

  return {
    fetchConfig,
    toggleEmailTemplate,
    editEmailTemplate,
    toggleSMS,
    saveSMSConfig,
    toggleSMSTemplate,
    editSMSTemplate,
    toggleWhatsApp,
    saveWhatsAppConfig,
    toggleWhatsAppTemplate,
    editWhatsAppTemplate,
    togglePush,
    savePushConfig,
    togglePushTemplate,
    editPushTemplate,
    toggleAnnouncement,
    createAnnouncement,
    saveIntegrations,
  }
}
