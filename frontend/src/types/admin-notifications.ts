export type ChannelTab = "email" | "sms" | "whatsapp" | "push" | "inapp"

export type AnnouncementType = "banner" | "modal" | "toast"
export type TargetAudience = "all" | "new" | "returning" | "vip"

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  /** HTML or plain text email body */
  body: string
  description: string
  isActive: boolean
  lastEdited: string
  triggerEvent: string
}

export interface ChannelTemplate {
  id: string
  name: string
  template: string
  triggerEvent: string
  isActive: boolean
}

export interface SMSConfig {
  provider: string
  senderId: string
  isEnabled: boolean
  templates: ChannelTemplate[]
}

export interface WhatsAppConfig {
  provider: string
  phoneNumber: string
  isEnabled: boolean
  templates: ChannelTemplate[]
}

export interface PushConfig {
  isEnabled: boolean
  vapidPublicKey: string
  templates: ChannelTemplate[]
}

export interface InAppAnnouncement {
  id: string
  title: string
  message: string
  targetAudience: TargetAudience
  startDate: string
  endDate: string
  isActive: boolean
  type: AnnouncementType
}

export interface NotificationsIntegrationConfig {
  listmonk: { url: string; isConnected: boolean }
  chatwoot: { url: string; isConnected: boolean; widgetToken: string }
}

export interface NotificationsConfig {
  emailTemplates: EmailTemplate[]
  smsConfig: SMSConfig
  whatsappConfig: WhatsAppConfig
  pushConfig: PushConfig
  inAppAnnouncements: InAppAnnouncement[]
  integrations: NotificationsIntegrationConfig
}

export interface AdminNotificationsProps {
  activeChannel: ChannelTab
  emailTemplates: EmailTemplate[]
  smsConfig: SMSConfig
  whatsappConfig: WhatsAppConfig
  pushConfig: PushConfig
  inAppAnnouncements: InAppAnnouncement[]
  integrations: NotificationsIntegrationConfig

  onChangeChannel?: (channel: ChannelTab) => void
  onToggleEmailTemplate?: (templateId: string) => Promise<void> | void
  onEditEmailTemplate?: (
    templateId: string,
    subject: string,
    body: string
  ) => Promise<void> | void
  onToggleSMS?: (enabled: boolean) => Promise<void> | void
  onSaveSMSConfig?: (config: SMSConfig) => Promise<void> | void
  onToggleSMSTemplate?: (templateId: string) => Promise<void> | void
  onEditSMSTemplate?: (
    templateId: string,
    template: string
  ) => Promise<void> | void
  onToggleWhatsApp?: (enabled: boolean) => Promise<void> | void
  onSaveWhatsAppConfig?: (config: WhatsAppConfig) => Promise<void> | void
  onToggleWhatsAppTemplate?: (templateId: string) => Promise<void> | void
  onEditWhatsAppTemplate?: (
    templateId: string,
    template: string
  ) => Promise<void> | void
  onTogglePush?: (enabled: boolean) => Promise<void> | void
  onSavePushConfig?: (config: PushConfig) => Promise<void> | void
  onTogglePushTemplate?: (templateId: string) => Promise<void> | void
  onEditPushTemplate?: (
    templateId: string,
    template: string
  ) => Promise<void> | void
  onToggleAnnouncement?: (announcementId: string) => Promise<void> | void
  onCreateAnnouncement?: (
    announcement: Omit<InAppAnnouncement, "id">
  ) => Promise<void> | void
  onSaveIntegrations?: (
    integrations: NotificationsIntegrationConfig
  ) => Promise<void> | void
}
