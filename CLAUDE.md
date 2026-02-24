# VastuCart — Developer Context for Claude Code

## Project Structure

Monorepo at `/root/projects/ecomstore/` (WSL, ext4):
- `backend/` — Medusa v2 backend (Node.js / TypeScript)
- `frontend/` — Next.js 14 App Router storefront + custom admin panel

Deployed on Coolify. No `git push` without explicit user permission.

---

## Critical Business Rules

### 1. Currency / Region — Geo-IP Based, Automatic

- **India visitors → INR region** (`reg_01KHTS3XAP0A8SM60C5NWECPRN`)
- **All other countries → USD region** (`reg_01KHTS4D79SRHK6SSJY1Q47R6P`)
- Detection is **automatic via IP geolocation** (Cloudflare `CF-IPCountry` header in production). No user-facing currency selector or dropdown. Ever.
- INR and USD prices are **manually entered per product** in Medusa admin — they are completely **independent** of each other. They are NOT currency conversions. Do not auto-convert.
- Region is set at **cart creation time** based on the visitor's detected country. Once a cart exists, its region/currency does not change.
- Product listing pages (homepage, category, search) are ISR-cached per build and will show INR prices by default. The critical path (cart + checkout) always uses the correct geo-detected region.

### 2. Payment Methods — Region-Strict

| Payment Method | India (INR) | International (USD) |
|---|---|---|
| Razorpay | ✅ Primary | ❌ Never |
| COD (Cash on Delivery) | ✅ With admin rules | ❌ Never |
| Stripe | ❌ Not applicable | ✅ Primary |
| PayPal | ❌ Not applicable | ✅ Backup / fallback |

- **COD rules** (fee, min order, max order) apply only to Indian customers. Never shown to international customers.
- Razorpay is INR-only. Never shown on USD carts.
- Stripe and PayPal are for international (USD) customers only.

### 3. Razorpay Architecture

Razorpay uses a **custom admin-driven approach** (not env vars):
- Admin pastes Key ID + Key Secret in Admin → Payments & Tax page
- Keys are stored in `store.metadata.payments_tax_config.gateways.razorpay`
- Backend route `POST /store/razorpay/create-order` reads keys from `store.metadata` at payment time
- Custom Medusa module `src/modules/razorpay-db` is a stateless placeholder — `authorizePayment()` always returns `"authorized"`, `getPaymentStatus()` always returns `"captured"`
- Frontend creates real Razorpay order via the custom route, opens Razorpay modal, then calls `cart.complete()` after payment

### 4. Stripe Architecture (pending implementation)

Stripe also uses **admin-driven key storage** (matching the Razorpay pattern):
- Admin pastes Publishable Key + Secret Key in Admin → Payments & Tax page
- Keys stored in `store.metadata.payments_tax_config.gateways.stripe`
- The env-var-based `@medusajs/payment-stripe` registration in `medusa-config.ts` should be removed or replaced with the admin-driven approach
- `STRIPE_API_KEY` env var in medusa-config.ts is already set up conditionally — if we go admin-driven, remove this approach

### 5. PayPal Architecture (pending implementation)

- Admin-driven or env-var-based TBD
- `@rsc-labs/medusa-paypal-payment` is already installed and conditionally registered in `medusa-config.ts`
- Acts as fallback to Stripe for international customers

### 6. No Pushing Without Permission

Never run `git push` without explicit user approval. Create commits freely, but always ask before pushing.

---

## Medusa Regions

| Region | Currency | Region ID |
|---|---|---|
| India | INR | `reg_01KHTS3XAP0A8SM60C5NWECPRN` |
| International | USD | `reg_01KHTS4D79SRHK6SSJY1Q47R6P` |

---

## Key Files

| File | Purpose |
|---|---|
| `frontend/src/lib/region.ts` | Fetches region IDs from Medusa, should be geo-aware |
| `frontend/src/providers/cart-provider.tsx` | Creates cart with region_id, must read geo cookie |
| `frontend/src/providers/checkout-provider.tsx` | initPayment() selects provider based on cart currency |
| `frontend/src/components/storefront/checkout/PaymentStep.tsx` | Shows correct payment options per currency |
| `backend/src/modules/razorpay-db/service.ts` | Razorpay Medusa placeholder module |
| `backend/src/api/store/razorpay/create-order/route.ts` | Reads Razorpay keys from store.metadata, creates real order |
| `backend/src/api/store/payment-config/route.ts` | Returns public payment config (key IDs) to frontend |
| `backend/src/api/store/integrations-config/route.ts` | Returns public-safe integration config (GA4, Meta Pixel, etc.) |
| `frontend/src/app/(storefront)/layout.tsx` | SSR layout, fetches integrations config |
| `frontend/src/components/storefront/TrackingScripts.tsx` | Injects GA4, Meta Pixel, Chatwoot, WhatsApp, Marketing Tags |
| `backend/medusa-config.ts` | Registers payment/auth/fulfillment/file providers and modules |

---

## Integrations Pipeline

Admin save → `store.metadata.integrations_config` → `GET /store/integrations-config` → `layout.tsx` SSR fetch (revalidate: 60s) → `TrackingScripts` injection.

Integrations supported: GA4, Meta Pixel, Chatwoot, WhatsApp floating button, TikTok, Pinterest, Snapchat, Twitter/X, LinkedIn, Google Ads.

---

## Constraints

- No agents — work directly with tools
- Enterprise-quality code: no hacks, patches, or workarounds
- Ask before assuming on design decisions
- Minimal changes: only modify what is necessary for the task
