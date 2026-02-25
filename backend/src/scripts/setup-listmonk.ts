/**
 * VastuCart Listmonk Setup Script
 * Run once after Listmonk starts to configure SMTP, list, and email templates.
 *
 * Usage:
 *   LISTMONK_URL=http://localhost:9003 \
 *   LISTMONK_USERNAME=listmonk \
 *   LISTMONK_PASSWORD=<password> \
 *   RESEND_API_KEY=re_xxxx \
 *   EMAIL_FROM="VastuCart <orders@vastucart.in>" \
 *   node .medusa/server/src/scripts/setup-listmonk.js
 *
 * Or from WSL dev:
 *   cd backend && npx ts-node src/scripts/setup-listmonk.ts
 */

const LISTMONK_URL = (process.env.LISTMONK_URL || "http://localhost:9003").replace(/\/$/, "")
const LISTMONK_USER = process.env.LISTMONK_USERNAME || "listmonk"
const LISTMONK_PASS = process.env.LISTMONK_PASSWORD || "listmonk"
const RESEND_API_KEY = process.env.RESEND_API_KEY || ""
const EMAIL_FROM = process.env.EMAIL_FROM || "VastuCart <orders@vastucart.in>"

function auth(): string {
  return "Basic " + Buffer.from(`${LISTMONK_USER}:${LISTMONK_PASS}`).toString("base64")
}

async function api<T = any>(path: string, method = "GET", body?: any): Promise<T> {
  const res = await fetch(`${LISTMONK_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: auth() },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as T
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function ensureList(name: string, type: "private" | "public" = "public"): Promise<number> {
  const data = await api<{ data: any }>("/api/lists?page=1&per_page=100")
  const lists: any[] = data?.data?.results || []
  const found = lists.find((l: any) => l.name === name)
  if (found) { console.log(`  ✓ List already exists: "${name}" (id ${found.id})`); return found.id }
  const created = await api<{ data: any }>("/api/lists", "POST", {
    name, type, optin: "single", tags: ["vastucart"],
  })
  const id = created?.data?.id
  console.log(`  + Created list: "${name}" (id ${id})`)
  return id
}

async function ensureTemplate(name: string, body: string): Promise<number> {
  const data = await api<{ data: any }>("/api/templates")
  const templates: any[] = Array.isArray(data?.data) ? data.data : (data?.data?.results || [])
  const found = templates.find((t: any) => t.name === name)
  if (found) {
    // Update existing template body
    await api(`/api/templates/${found.id}`, "PUT", { name, type: "tx", body, is_default: false })
    console.log(`  ↑ Updated template: "${name}" (id ${found.id})`)
    return found.id
  }
  const created = await api<{ data: any }>("/api/templates", "POST", {
    name, type: "tx", body, is_default: false,
  })
  const id = created?.data?.id
  console.log(`  + Created template: "${name}" (id ${id})`)
  return id
}

async function configureSMTP(): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log("  ⚠  RESEND_API_KEY not set – skipping SMTP configuration")
    return
  }
  const settings = {
    "app.from_email": EMAIL_FROM,
    smtp: [
      {
        uuid: "vc-resend-smtp",
        enabled: true,
        host: "smtp.resend.com",
        hello_hostname: "",
        port: 587,
        auth_protocol: "login",
        username: "resend",
        password: RESEND_API_KEY,
        email: EMAIL_FROM,
        name: "VastuCart",
        tls_type: "STARTTLS",
        tls_skip_verify: false,
        max_conns: 10,
        max_msg_retries: 2,
        idle_timeout: "15s",
        wait_timeout: "5s",
        pool_wait_timeout: "15s",
      },
    ],
  }
  await api("/api/settings", "PUT", settings)
  console.log("  ✓ SMTP configured (Resend via smtp.resend.com:587)")
}

// ── HTML Templates ────────────────────────────────────────────────────────────

const HEADER = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="background-color:#013f47;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
      <p style="margin:0;font-size:26px;font-weight:700;color:#f4ede6;letter-spacing:3px;font-family:Arial,Helvetica,sans-serif;">&#10022; VastuCart</p>
      <p style="margin:6px 0 0;font-size:11px;color:rgba(244,237,230,0.6);letter-spacing:4px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Sacred Space &middot; Serene Living</p>
    </td>
  </tr>
</table>`

const UPSELL_CATEGORIES = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px;">
  <tr>
    <td style="padding:0 0 16px;">
      <p style="margin:0;font-size:15px;font-weight:700;color:#013f47;text-align:center;font-family:Arial,Helvetica,sans-serif;">Complete Your Vastu Sanctuary</p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">Customers who bought this also loved:</p>
    </td>
  </tr>
  <tr>
    <td>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="32%" valign="top" style="padding-right:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=yantras" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:16px;text-align:center;font-size:28px;color:#f4ede6;">&#9784;</td></tr>
                <tr><td style="padding:10px 12px;background:#f0f9fa;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Vastu Yantras</p>
                  <p style="margin:3px 0 0;font-size:11px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Sacred geometry for home harmony</p>
                  <p style="margin:6px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="36%" valign="top" style="padding:0 3px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=crystals" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:16px;text-align:center;font-size:28px;color:#f4ede6;">&#9670;</td></tr>
                <tr><td style="padding:10px 12px;background:#f0f9fa;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Healing Crystals</p>
                  <p style="margin:3px 0 0;font-size:11px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Balance energy &amp; aura in every room</p>
                  <p style="margin:6px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="32%" valign="top" style="padding-left:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=incense" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:16px;text-align:center;font-size:28px;color:#f4ede6;">&#10022;</td></tr>
                <tr><td style="padding:10px 12px;background:#f0f9fa;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Incense &amp; Diyas</p>
                  <p style="margin:3px 0 0;font-size:11px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Purify &amp; illuminate your space</p>
                  <p style="margin:6px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

const FOOTER = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <tr>
    <td style="background-color:#013f47;padding:24px 32px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#f4ede6;font-family:Arial,Helvetica,sans-serif;">&#10022; VastuCart</p>
      <p style="margin:0 0 6px;font-size:12px;font-family:Arial,Helvetica,sans-serif;">
        <a href="{{ .Data.store_url }}" style="color:rgba(244,237,230,0.8);text-decoration:none;">vastucart.in</a>
        &nbsp;&middot;&nbsp;
        <a href="mailto:{{ .Data.support_email }}" style="color:rgba(244,237,230,0.8);text-decoration:none;">{{ .Data.support_email }}</a>
      </p>
      <p style="margin:0 0 8px;font-size:11px;color:rgba(244,237,230,0.45);font-family:Arial,Helvetica,sans-serif;">
        &copy; 2025 VastuCart. All rights reserved.
      </p>
      <p style="margin:0;font-size:11px;font-family:Arial,Helvetica,sans-serif;">
        <a href="{{ .UnsubscribeURL }}" style="color:rgba(244,237,230,0.45);text-decoration:underline;">Unsubscribe</a>
      </p>
    </td>
  </tr>
</table>`

function wrapEmail(preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>VastuCart</title>
</head>
<body style="margin:0;padding:0;background-color:#f4ede6;-webkit-text-size-adjust:none;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#f4ede6;">${preheader}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4ede6;padding:24px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 2px 12px rgba(1,63,71,0.08);">
        ${HEADER}
        ${content}
        ${FOOTER}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

// ── Order Confirmed ──────────────────────────────────────────────────────────
function orderConfirmedBody(): string {
  const content = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <!-- Hero -->
  <tr>
    <td style="background-color:#014f5a;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:40px;line-height:1;color:#f4ede6;">&#10003;</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#f4ede6;font-family:Arial,Helvetica,sans-serif;">Order Confirmed!</p>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(244,237,230,0.75);font-family:Arial,Helvetica,sans-serif;">Thank you for your order, {{ .Data.customer_name }}.</p>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        We're thrilled to receive your order and our team is already preparing your Vastu essentials with care. You'll receive a shipping update once your order is dispatched.
      </p>

      <!-- Order meta box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f9fa;border:1px solid #b2dde3;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Order Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Order ID</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">#{{ .Data.order_id }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Order Date</td>
                <td style="font-size:13px;color:#2d2d2d;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.order_date }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Payment</td>
                <td style="font-size:13px;color:#2d2d2d;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.payment_method }}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:10px 0 4px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #cce5e8;"></td></tr></table>
                </td>
              </tr>
              <tr>
                <td style="font-size:14px;color:#013f47;font-weight:700;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.items_count }}</td>
                <td style="font-size:16px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.order_total }}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-size:12px;color:#6b7280;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">{{ .Data.items_summary }}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Shipping address box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fffbf5;border:1px solid #e8d5bc;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Delivering To</p>
            <p style="margin:0;font-size:14px;color:#013f47;font-weight:700;font-family:Arial,Helvetica,sans-serif;">{{ .Data.shipping_name }}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#4b5563;line-height:1.5;font-family:Arial,Helvetica,sans-serif;">{{ .Data.shipping_address }}</p>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="{{ .Data.order_url }}" style="display:inline-block;background-color:#c85103;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">View Your Order &rarr;</a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
        <tr>
          <td style="border-top:1px solid #f0e8dd;text-align:center;padding-top:0;">
            <span style="display:inline-block;background:#fff;padding:0 14px;margin-top:-12px;font-size:18px;color:#c85103;">&#10022;</span>
          </td>
        </tr>
      </table>

      <!-- Soft upsell -->
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">While we prepare your order, explore more Vastu essentials:</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="33%" valign="top" style="padding-right:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_placed&utm_content=yantras" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9784;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Vastu Yantras</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="34%" valign="top" style="padding:0 3px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_placed&utm_content=crystals" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9670;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Healing Crystals</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="33%" valign="top" style="padding-left:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_placed&utm_content=incense" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#10022;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Incense &amp; Diyas</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  return wrapEmail(
    "Order #{{ .Data.order_id }} confirmed! Thank you, {{ .Data.customer_name }}.",
    content
  )
}

// ── Order Shipped ────────────────────────────────────────────────────────────
function orderShippedBody(): string {
  const content = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <!-- Hero -->
  <tr>
    <td style="background-color:#015c6e;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:36px;line-height:1;color:#f4ede6;">&#128666;</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#f4ede6;font-family:Arial,Helvetica,sans-serif;">Your Order Is On Its Way!</p>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(244,237,230,0.75);font-family:Arial,Helvetica,sans-serif;">Great news — your Vastu essentials are in transit.</p>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Hi {{ .Data.customer_name }},<br /><br />
        Your order <strong style="color:#013f47;">#{{ .Data.order_id }}</strong> has been dispatched and is now on its way to you. Estimated delivery: <strong style="color:#013f47;">{{ .Data.estimated_delivery }}</strong>.
      </p>

      <!-- Tracking box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f9fa;border:1px solid #b2dde3;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Shipment Details</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Order ID</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">#{{ .Data.order_id }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Carrier</td>
                <td style="font-size:13px;color:#2d2d2d;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.carrier }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Tracking Number</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.tracking_number }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Est. Delivery</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.estimated_delivery }}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding:10px 0 4px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td style="border-top:1px solid #cce5e8;"></td></tr></table>
                </td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Items</td>
                <td style="font-size:12px;color:#6b7280;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.items_count }} &middot; {{ .Data.order_total }}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="{{ .Data.tracking_url }}" style="display:inline-block;background-color:#c85103;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Track Your Package &rarr;</a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
        <tr>
          <td style="border-top:1px solid #f0e8dd;text-align:center;padding-top:0;">
            <span style="display:inline-block;background:#fff;padding:0 14px;margin-top:-12px;font-size:18px;color:#c85103;">&#10022;</span>
          </td>
        </tr>
      </table>

      <!-- While you wait -->
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">While your order is on the way, prepare your sacred space:</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="33%" valign="top" style="padding-right:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_shipped&utm_content=yantras" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9784;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Vastu Yantras</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="34%" valign="top" style="padding:0 3px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_shipped&utm_content=crystals" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9670;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Healing Crystals</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="33%" valign="top" style="padding-left:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_shipped&utm_content=incense" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#10022;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Incense &amp; Diyas</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  return wrapEmail(
    "Your order #{{ .Data.order_id }} is on its way! Tracking: {{ .Data.tracking_number }}.",
    content
  )
}

// ── Order Delivered ──────────────────────────────────────────────────────────
function orderDeliveredBody(): string {
  const content = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <!-- Hero -->
  <tr>
    <td style="background-color:#c85103;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:36px;line-height:1;color:#fff;">&#127873;</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">Your Order Has Arrived!</p>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8);font-family:Arial,Helvetica,sans-serif;">Your Vastu essentials are now with you.</p>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Hi {{ .Data.customer_name }}, your order <strong style="color:#013f47;">#{{ .Data.order_id }}</strong> has been successfully delivered. We hope you love everything — may your new additions bring harmony and positive energy to your space! &#10022;
      </p>

      <!-- Loyalty points banner -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg, #013f47, #015c6e);border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:16px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="font-size:13px;color:rgba(244,237,230,0.8);font-family:Arial,Helvetica,sans-serif;">&#127381; Loyalty Points Earned</td>
                <td style="text-align:right;">
                  <span style="font-size:22px;font-weight:700;color:#f4ede6;font-family:Arial,Helvetica,sans-serif;">+{{ .Data.loyalty_points }}</span>
                  <span style="font-size:12px;color:rgba(244,237,230,0.7);font-family:Arial,Helvetica,sans-serif;"> pts</span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="font-size:11px;color:rgba(244,237,230,0.55);padding-top:4px;font-family:Arial,Helvetica,sans-serif;">Redeem on your next order in My Account &rarr; Loyalty Points</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Order summary -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f9fa;border:1px solid #b2dde3;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:14px 18px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="font-size:12px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Order</td>
                <td style="font-size:12px;color:#013f47;font-weight:700;text-align:right;font-family:Arial,Helvetica,sans-serif;">#{{ .Data.order_id }}</td>
              </tr>
              <tr>
                <td style="font-size:12px;color:#6b7280;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">{{ .Data.items_count }}</td>
                <td style="font-size:12px;color:#013f47;font-weight:700;text-align:right;padding-top:4px;font-family:Arial,Helvetica,sans-serif;">{{ .Data.order_total }}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-size:11px;color:#9ca3af;padding-top:3px;font-family:Arial,Helvetica,sans-serif;">{{ .Data.items_summary }}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA row: Review + View Order -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td width="50%" style="padding-right:6px;" align="center">
            <a href="{{ .Data.review_url }}" style="display:inline-block;background-color:#c85103;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">&#11088; Leave a Review</a>
          </td>
          <td width="50%" style="padding-left:6px;" align="center">
            <a href="{{ .Data.order_url }}" style="display:inline-block;background-color:#013f47;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:6px;font-family:Arial,Helvetica,sans-serif;">View Order</a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
        <tr>
          <td style="border-top:2px solid #f0e8dd;text-align:center;padding-top:0;">
            <span style="display:inline-block;background:#fff;padding:0 14px;margin-top:-12px;font-size:18px;color:#c85103;">&#10022;</span>
          </td>
        </tr>
      </table>

      <!-- STRONG Upsell -->
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#013f47;text-align:center;font-family:Arial,Helvetica,sans-serif;">Complete Your Vastu Sanctuary</p>
      <p style="margin:0 0 18px;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">Customers who ordered this also love these products:</p>

      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="33%" valign="top" style="padding-right:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=yantras" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:2px solid #013f47;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:18px 12px;text-align:center;font-size:30px;color:#f4ede6;">&#9784;</td></tr>
                <tr><td style="padding:10px 12px;background:#fffbf5;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Vastu Yantras</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Sacred geometry for home harmony</p>
                  <p style="margin:8px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="34%" valign="top" style="padding:0 3px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=crystals" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:2px solid #013f47;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:18px 12px;text-align:center;font-size:30px;color:#f4ede6;">&#9670;</td></tr>
                <tr><td style="padding:10px 12px;background:#fffbf5;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Healing Crystals</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Balance energy &amp; aura in every room</p>
                  <p style="margin:8px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="33%" valign="top" style="padding-left:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_delivered&utm_content=incense" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:2px solid #013f47;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:18px 12px;text-align:center;font-size:30px;color:#f4ede6;">&#10022;</td></tr>
                <tr><td style="padding:10px 12px;background:#fffbf5;">
                  <p style="margin:0;font-size:12px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Incense &amp; Diyas</p>
                  <p style="margin:3px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Purify &amp; illuminate your space</p>
                  <p style="margin:8px 0 0;font-size:11px;color:#c85103;font-weight:700;font-family:Arial,Helvetica,sans-serif;">Shop Now &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  return wrapEmail(
    "Your VastuCart order #{{ .Data.order_id }} has been delivered! You earned {{ .Data.loyalty_points }} loyalty points.",
    content
  )
}

// ── Order Cancelled ──────────────────────────────────────────────────────────
function orderCancelledBody(): string {
  const content = `
<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
  <!-- Hero -->
  <tr>
    <td style="background-color:#374151;padding:28px 32px;text-align:center;">
      <p style="margin:0;font-size:36px;line-height:1;color:#f4ede6;">&#10060;</p>
      <p style="margin:8px 0 0;font-size:22px;font-weight:700;color:#f4ede6;font-family:Arial,Helvetica,sans-serif;">Order Cancelled</p>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(244,237,230,0.7);font-family:Arial,Helvetica,sans-serif;">We're sorry this order didn't work out.</p>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#4b5563;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
        Hi {{ .Data.customer_name }},<br /><br />
        Your order <strong style="color:#013f47;">#{{ .Data.order_id }}</strong> has been cancelled. We're sorry to see this happen. If you didn't request this cancellation or have any questions, please reach out to our support team.
      </p>

      <!-- Refund info box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fef3f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:20px;">
        <tr>
          <td style="padding:18px 20px;">
            <p style="margin:0 0 12px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;">Refund Information</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Order ID</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">#{{ .Data.order_id }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Order Total</td>
                <td style="font-size:13px;color:#013f47;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.refund_amount }}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">Refund Timeline</td>
                <td style="font-size:13px;color:#059669;font-weight:700;text-align:right;padding:4px 0;font-family:Arial,Helvetica,sans-serif;">{{ .Data.refund_timeline }}</td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:12px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">
              Refunds for online payments will be processed to your original payment method. For COD orders, no charge was made.
            </p>
          </td>
        </tr>
      </table>

      <!-- Support box -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f0f9fa;border:1px solid #b2dde3;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">&#128241; Need Help?</p>
            <p style="margin:0;font-size:13px;color:#4b5563;font-family:Arial,Helvetica,sans-serif;">
              Our support team is here for you. Reach us at
              <a href="mailto:{{ .Data.support_email }}" style="color:#c85103;font-weight:700;text-decoration:none;">{{ .Data.support_email }}</a>
              and we'll resolve any issues quickly.
            </p>
          </td>
        </tr>
      </table>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
        <tr>
          <td align="center">
            <a href="{{ .Data.store_url }}" style="display:inline-block;background-color:#c85103;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Explore VastuCart &rarr;</a>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
        <tr>
          <td style="border-top:1px solid #f0e8dd;text-align:center;padding-top:0;">
            <span style="display:inline-block;background:#fff;padding:0 14px;margin-top:-12px;font-size:18px;color:#c85103;">&#10022;</span>
          </td>
        </tr>
      </table>

      <!-- Soft upsell -->
      <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;font-family:Arial,Helvetica,sans-serif;">Browse our Vastu essentials and place a new order anytime:</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td width="33%" valign="top" style="padding-right:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_cancelled&utm_content=yantras" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9784;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Vastu Yantras</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="34%" valign="top" style="padding:0 3px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_cancelled&utm_content=crystals" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#9670;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Healing Crystals</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
          <td width="33%" valign="top" style="padding-left:6px;">
            <a href="{{ .Data.store_url }}?utm_source=email&utm_medium=transactional&utm_campaign=order_cancelled&utm_content=incense" style="display:block;text-decoration:none;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid #cce5e8;border-radius:8px;overflow:hidden;">
                <tr><td style="background-color:#013f47;padding:12px;text-align:center;font-size:22px;color:#f4ede6;">&#10022;</td></tr>
                <tr><td style="padding:8px 10px;background:#f0f9fa;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#013f47;font-family:Arial,Helvetica,sans-serif;">Incense &amp; Diyas</p>
                  <p style="margin:2px 0 0;font-size:10px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;">Shop &rarr;</p>
                </td></tr>
              </table>
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
  return wrapEmail(
    "Your VastuCart order #{{ .Data.order_id }} has been cancelled. Refund: {{ .Data.refund_timeline }}.",
    content
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 VastuCart Listmonk Setup")
  console.log(`   URL:  ${LISTMONK_URL}`)
  console.log(`   User: ${LISTMONK_USER}`)
  console.log("")

  // 1. Configure SMTP (Resend)
  console.log("1. Configuring SMTP (Resend)...")
  await configureSMTP()

  // 2. Create newsletter list
  console.log("2. Ensuring newsletter list...")
  await ensureList("VastuCart Newsletter", "public")

  // 3. Create email templates
  console.log("3. Ensuring email templates...")
  await ensureTemplate("VC Order Confirmed", orderConfirmedBody())
  await ensureTemplate("VC Order Shipped", orderShippedBody())
  await ensureTemplate("VC Order Delivered", orderDeliveredBody())
  await ensureTemplate("VC Order Cancelled", orderCancelledBody())

  console.log("\n✅ Listmonk setup complete!")
  console.log("   Templates: VC Order Confirmed, VC Order Shipped, VC Order Delivered, VC Order Cancelled")
  console.log("   List: VastuCart Newsletter")
  if (RESEND_API_KEY) {
    console.log("   SMTP: Resend (smtp.resend.com:587) ✓")
  } else {
    console.log("   SMTP: ⚠  RESEND_API_KEY not set — configure SMTP manually in Listmonk UI")
  }
  console.log("")
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Setup failed:", err.message)
    process.exit(1)
  })
