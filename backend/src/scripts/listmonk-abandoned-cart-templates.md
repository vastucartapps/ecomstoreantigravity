# Listmonk Templates — Abandoned Cart Recovery

The abandoned cart job (`src/jobs/abandoned-cart-recovery.ts`) sends three
transactional emails via Listmonk. Each template must exist in Listmonk
before the job will deliver anything — the client looks up the template
by **name** and caches the ID.

Create each template at: `<listmonk-url>/admin/campaigns/templates` → **New template** → Type: **Transactional**.

Template bodies use Listmonk's Go-template syntax. Every listed `{{ .Subscriber.* }}` is optional; the job passes `data` values — access them via `{{ .Tx.Data.FIELD }}`.

---

## 1. `VC Cart Reminder 1h`

**Subject** (sent dynamically): `You left something in your cart, {{CUSTOMER_NAME}}`

**Body** — copy & paste:

```html
<p>Hi {{ .Tx.Data.customer_name }},</p>

<p>You left <strong>{{ .Tx.Data.items_count }}</strong> in your VastuCart cart ({{ .Tx.Data.items_summary }}) — total <strong>{{ .Tx.Data.cart_total }}</strong>.</p>

<p>Your cart is saved and ready whenever you are. One click brings everything back:</p>

<p>
  <a href="{{ .Tx.Data.recover_url }}"
     style="background:#013f47;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">
    Return to my cart
  </a>
</p>

<p>Questions? Reply to this email or write to us at
<a href="mailto:{{ .Tx.Data.support_email }}">{{ .Tx.Data.support_email }}</a>.</p>

<p>— The VastuCart Team</p>
```

---

## 2. `VC Cart Reminder 24h`

**Subject**: `Still thinking about your {{ITEMS_COUNT}}?`

**Body**:

```html
<p>Hi {{ .Tx.Data.customer_name }},</p>

<p>Your <strong>{{ .Tx.Data.items_count }}</strong> are still waiting for you —
and so are thousands of satisfied VastuCart customers who've discovered the power
of authentic spiritual products at home.</p>

<p>
  <strong>Your cart:</strong> {{ .Tx.Data.items_summary }}<br>
  <strong>Total:</strong> {{ .Tx.Data.cart_total }}
</p>

<p>Popular items tend to sell out fast. Secure yours now:</p>

<p>
  <a href="{{ .Tx.Data.recover_url }}"
     style="background:#013f47;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">
    Complete my order
  </a>
</p>

<p style="color:#6b5d52;font-size:13px;">
  Fast delivery across India · Secure checkout · Authentic products
</p>

<p>— The VastuCart Team</p>
```

---

## 3. `VC Cart Reminder 72h Discount`

**Subject**: `Last chance — {{DISCOUNT_CODE}} gets you 5% off`

**Body**:

```html
<p>Hi {{ .Tx.Data.customer_name }},</p>

<p>We noticed your cart is still there, and we don't want you to miss out.
Here's a welcome-back gift from us:</p>

{{ if .Tx.Data.discount_code }}
<div style="background:#fff7e6;border:2px dashed #c85103;padding:18px;border-radius:10px;text-align:center;margin:20px 0;">
  <div style="font-size:12px;color:#8a5a1f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
    Your {{ .Tx.Data.discount_percent }}% discount
  </div>
  <code style="font-size:26px;font-weight:700;color:#c85103;font-family:monospace;letter-spacing:3px;">
    {{ .Tx.Data.discount_code }}
  </code>
  <div style="font-size:12px;color:#6b5d52;margin-top:8px;">
    Valid until {{ .Tx.Data.discount_expires }}
  </div>
</div>
{{ else }}
<p><em>Your cart is about to expire.</em></p>
{{ end }}

<p>Your cart ({{ .Tx.Data.items_summary }}) — total <strong>{{ .Tx.Data.cart_total }}</strong>.</p>

<p>
  <a href="{{ .Tx.Data.recover_url }}"
     style="background:#c85103;color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:700;">
    Claim my discount
  </a>
</p>

<p style="color:#6b5d52;font-size:13px;">
  This is the final reminder. After this, your cart may be cleared.
</p>

<p>— The VastuCart Team</p>
```

---

## Admin configuration

Once templates exist, enable the job by setting `store.metadata.abandoned_cart_config`:

```json
{
  "enabled": true,
  "recovery_code": "COMEBACK5",
  "batch_size": 200
}
```

- `enabled` (boolean) — master kill-switch. When `false`, job runs but sends nothing.
- `recovery_code` (string) — admin-created persistent promotion code (5% off, 7-day expiry recommended). The job embeds it in stage-3 emails. Leave empty to send stage 3 without a discount code.
- `batch_size` (number, default 200, max 1000) — max carts processed per 15-min tick.

Create the `COMEBACK5` code in Admin → Coupons & Gift Cards.
