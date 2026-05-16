import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"
import { captureException, captureWarning } from "../../lib/error-reporter"

/**
 * VastuCart Resend Notification Provider
 *
 * Bridges the Medusa Notification module to the Resend HTTP API. Activated
 * by the notification module when RESEND_API_KEY is set; falls back to
 * notification-local when not. Handles the small set of system-emitted
 * notifications Medusa fires natively (password reset, email verification,
 * support-ticket created). Marketing + order lifecycle emails continue to
 * flow through Listmonk via the email-template-notifications subscriber.
 *
 * Why a custom provider instead of a published package:
 * - Keeps the dependency surface small (uses native fetch).
 * - Lets us co-locate template HTML with the brand for SSoT consistency.
 * - Avoids the @medusajs/notification-sendgrid lock-in pattern.
 */

interface ResendOptions {
  apiKey: string
  /** Verified sender, e.g. "VastuCart <orders@vastucart.in>" */
  from: string
  /** Optional override domain for footer / unsubscribe links. */
  storeUrl?: string
}

interface RenderedEmail {
  subject: string
  html: string
  text: string
}

class ResendNotificationService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  protected readonly config_: ResendOptions
  protected readonly logger_: any

  constructor({ logger }: { logger: any }, options: ResendOptions) {
    super()
    this.config_ = {
      apiKey: options.apiKey,
      from: options.from || "VastuCart <orders@vastucart.in>",
      storeUrl: options.storeUrl,
    }
    this.logger_ = logger
    if (!this.config_.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "notification-resend: RESEND_API_KEY is required"
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification?.to) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "notification-resend: missing recipient (`to`)"
      )
    }
    if (notification.channel !== "email") {
      // Only handle email channel — let other channels no-op so SMS/push
      // can be wired to dedicated providers later without conflict.
      return {}
    }

    const rendered = this.renderTemplate(
      notification.template,
      (notification.data as Record<string, any>) || {}
    )

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config_.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.config_.from,
          to: [notification.to],
          subject: rendered.subject,
          html: rendered.html,
          text: rendered.text,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        const err = new Error(`Resend API ${res.status}: ${body}`)
        captureException(err, {
          source: "modules/notification-resend",
          to: notification.to,
          template: notification.template,
        })
        throw err
      }

      const json = (await res.json()) as { id?: string }
      return { id: json.id }
    } catch (err) {
      captureException(err, {
        source: "modules/notification-resend",
        to: notification.to,
        template: notification.template,
      })
      throw err
    }
  }

  /**
   * Render a notification template name + data into subject/html/text.
   * Falls back to a generic template if no specific one is registered —
   * better to deliver a plain message than to silently drop the email.
   */
  protected renderTemplate(template: string | undefined, data: Record<string, any>): RenderedEmail {
    const storeUrl = this.config_.storeUrl || data.store_url || "https://store.vastucart.in"
    const storeName = data.store_name || "VastuCart"

    switch (template) {
      case "password-reset":
      case "auth.password_reset":
      case "customer.password_reset": {
        const url = data.url || data.reset_url || `${storeUrl}/reset-password`
        const subject = `Reset your ${storeName} password`
        const text =
          `Hi,\n\nWe received a request to reset your ${storeName} password.\n\n` +
          `Reset it here (link expires in 24h):\n${url}\n\n` +
          `If you didn't request this, you can ignore this email.\n— ${storeName}`
        const html = wrapHtml({
          storeName,
          storeUrl,
          title: "Reset your password",
          body: `<p>We received a request to reset your <strong>${escapeHtml(storeName)}</strong> password.</p>
            <p>Click below to set a new one. This link expires in 24 hours.</p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${escapeAttr(url)}" style="display:inline-block;padding:14px 28px;background:#013f47;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Reset password</a>
            </p>
            <p style="font-size:12px;color:#75615a;">If you didn't request a reset, ignore this email — your password stays the same.</p>`,
        })
        return { subject, html, text }
      }

      case "email-verification":
      case "auth.email_verification":
      case "customer.email_verification": {
        const url = data.url || data.verification_url || `${storeUrl}/account`
        const subject = `Verify your ${storeName} email`
        const text =
          `Welcome to ${storeName}.\n\n` +
          `Confirm your email to activate your account:\n${url}\n\n— ${storeName}`
        const html = wrapHtml({
          storeName,
          storeUrl,
          title: "Verify your email",
          body: `<p>Welcome to <strong>${escapeHtml(storeName)}</strong>. Click below to confirm your email address.</p>
            <p style="text-align:center;margin:32px 0;">
              <a href="${escapeAttr(url)}" style="display:inline-block;padding:14px 28px;background:#013f47;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Verify email</a>
            </p>`,
        })
        return { subject, html, text }
      }

      case "support-ticket-created": {
        const subject = `[Support] New ticket: ${data.category || "general"}`
        const text =
          `New support ticket #${data.ticket_id}\n` +
          `From: ${data.customer_name} <${data.customer_email}>\n` +
          `Category: ${data.category}\n\n` +
          `${data.message}\n\n` +
          `Admin: ${data.admin_url}`
        const html = wrapHtml({
          storeName,
          storeUrl,
          title: `New support ticket #${escapeHtml(String(data.ticket_id || ""))}`,
          body: `<p><strong>From:</strong> ${escapeHtml(String(data.customer_name || ""))} &lt;${escapeHtml(String(data.customer_email || ""))}&gt;</p>
            <p><strong>Category:</strong> ${escapeHtml(String(data.category || ""))}</p>
            <p><strong>Message:</strong></p>
            <pre style="background:#f5f0ea;padding:12px;border-radius:6px;white-space:pre-wrap;font-family:inherit;">${escapeHtml(String(data.message || ""))}</pre>
            <p style="margin-top:24px;"><a href="${escapeAttr(String(data.admin_url || storeUrl))}" style="color:#013f47;font-weight:600;">Open in admin →</a></p>`,
        })
        return { subject, html, text }
      }

      default: {
        // Fallback: render whatever data we got as a generic notification.
        captureWarning("notification-resend: unknown template, using fallback", {
          source: "modules/notification-resend",
          template: template ?? null,
        })
        const subject =
          (data.subject as string) ||
          (data.title as string) ||
          `${storeName} notification`
        const text =
          (data.text as string) ||
          (data.body as string) ||
          (data.message as string) ||
          `You have a new notification from ${storeName}.`
        const html = wrapHtml({
          storeName,
          storeUrl,
          title: subject,
          body: `<p>${escapeHtml(text)}</p>`,
        })
        return { subject, html, text }
      }
    }
  }
}

// ─── Render helpers (plain string concat — no template engine dependency) ───

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttr(value: string): string {
  return escapeHtml(value)
}

function wrapHtml(opts: { storeName: string; storeUrl: string; title: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:24px;background:#f5f0ea;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#013f47;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
    <tr><td style="padding:24px 32px;border-bottom:1px solid #e8e0d8;">
      <a href="${escapeAttr(opts.storeUrl)}" style="font-size:18px;font-weight:700;color:#013f47;text-decoration:none;">${escapeHtml(opts.storeName)}</a>
    </td></tr>
    <tr><td style="padding:32px;">
      <h1 style="font-size:22px;margin:0 0 16px 0;color:#013f47;">${escapeHtml(opts.title)}</h1>
      ${opts.body}
    </td></tr>
    <tr><td style="padding:16px 32px;border-top:1px solid #e8e0d8;font-size:12px;color:#75615a;">
      <a href="${escapeAttr(opts.storeUrl)}" style="color:#75615a;text-decoration:none;">${escapeHtml(opts.storeUrl.replace(/^https?:\/\//, ""))}</a>
    </td></tr>
  </table>
</body>
</html>`
}

export default ResendNotificationService
