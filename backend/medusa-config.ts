import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'
import { validateEnv } from './src/lib/env-validation'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Fail fast if required env vars are missing or insecure.
validateEnv()

// ─── Conditional payment providers ────────────────────────
const paymentProviders: any[] = []

// Razorpay — always registered; reads key_id + key_secret from
// store.metadata.payments_tax_config.gateways (Admin > Payments).
// No Coolify env vars needed for payment keys.
paymentProviders.push({
  resolve: "./src/modules/razorpay-db",
  id: "razorpay",
  options: {},
})

// Stripe — always registered; reads publishable + secret keys from
// store.metadata.payments_tax_config.gateways (Admin > Payments).
// No Coolify env vars needed. Used for international (USD) customers.
paymentProviders.push({
  resolve: "./src/modules/stripe-db",
  id: "stripe",
  options: {},
})

if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  paymentProviders.push({
    resolve: "@rsc-labs/medusa-paypal-payment/providers/paypal-payment",
    id: "paypal-payment",
    options: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
    },
  })
}

// ─── Conditional auth providers ───────────────────────────
const authProviders: any[] = [
  {
    resolve: "@medusajs/medusa/auth-emailpass",
    id: "emailpass",
  },
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  authProviders.push({
    resolve: "@medusajs/medusa/auth-google",
    id: "google",
    options: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    },
  })
}

// ─── Conditional fulfillment providers ────────────────────
const fulfillmentProviders: any[] = [
  {
    resolve: "@medusajs/medusa/fulfillment-manual",
    id: "manual",
  },
]

if (process.env.SHIPSTATION_API_KEY) {
  fulfillmentProviders.push({
    resolve: "./src/modules/shipstation",
    id: "shipstation",
    options: {
      api_key: process.env.SHIPSTATION_API_KEY,
    },
  })
}

// ─── Conditional plugins ──────────────────────────────────
const plugins: any[] = [
  { resolve: "medusa-variant-images", options: {} },
  { resolve: "@lambdacurry/medusa-webhooks", options: {} },
  { resolve: "@alpha-solutions/medusa-image-alt", options: {} },
  {
    resolve: "@rsc-labs/medusa-wishlist",
    options: { jwtSecret: process.env.JWT_SECRET },
  },
]

if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
  plugins.push({
    resolve: "@rsc-labs/medusa-paypal-payment",
    options: {
      oAuthClientId: process.env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
    },
  })
}

if (process.env.GA4_MEASUREMENT_ID && process.env.GA4_API_SECRET) {
  plugins.push({
    resolve: "@variablevic/google-analytics-medusa",
    options: {
      measurementId: process.env.GA4_MEASUREMENT_ID,
      apiSecret: process.env.GA4_API_SECRET,
      debug: process.env.NODE_ENV !== "production",
    },
  })
}

// ─── Modules ──────────────────────────────────────────────
const modules: any[] = [
  // Payment (always registered, providers are conditional)
  {
    resolve: "@medusajs/medusa/payment",
    options: { providers: paymentProviders },
  },

  // Auth
  {
    resolve: "@medusajs/medusa/auth",
    options: { providers: authProviders },
  },

  // File Storage (S3 / MinIO)
  {
    resolve: "@medusajs/medusa/file",
    options: {
      providers: [
        {
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || "us-east-1",
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            additional_client_config: {
              forcePathStyle: true,
            },
          },
        },
      ],
    },
  },

  // Notification — Resend handles real email delivery when RESEND_API_KEY is
  // set; otherwise notification-local logs to stdout so dev still works.
  // notification-local is kept registered as a safety net for the in-app
  // channel and any non-email notifications.
  {
    resolve: "@medusajs/medusa/notification",
    options: {
      providers: (() => {
        const providers: any[] = [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: { channels: ["email"] },
          },
        ]
        if (process.env.RESEND_API_KEY) {
          providers.push({
            resolve: "./src/modules/notification-resend",
            id: "resend",
            options: {
              channels: ["email"],
              apiKey: process.env.RESEND_API_KEY,
              from: process.env.EMAIL_FROM || "VastuCart <orders@vastucart.in>",
              storeUrl: process.env.STORE_URL,
            },
          })
        }
        return providers
      })(),
    },
  },

  // Fulfillment
  {
    resolve: "@medusajs/medusa/fulfillment",
    options: { providers: fulfillmentProviders },
  },

  // Algolia Search
  {
    resolve: "./src/modules/algolia",
    options: {
      appId: process.env.ALGOLIA_APP_ID,
      apiKey: process.env.ALGOLIA_API_KEY,
      productIndexName: process.env.ALGOLIA_PRODUCT_INDEX_NAME || "products",
    },
  },

  // Contentful CMS
  {
    resolve: "./src/modules/contentful",
    options: {
      management_access_token: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
      delivery_token: process.env.CONTENTFUL_DELIVERY_TOKEN,
      space_id: process.env.CONTENTFUL_SPACE_ID,
      environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
      default_locale: "en-US",
      webhook_secret: process.env.CONTENTFUL_WEBHOOK_SECRET,
    },
  },

  // Payload CMS
  {
    resolve: "./src/modules/payload",
    options: {
      serverUrl: process.env.PAYLOAD_SERVER_URL || "http://localhost:8000",
      apiKey: process.env.PAYLOAD_API_KEY,
      userCollection: process.env.PAYLOAD_USER_COLLECTION || "users",
    },
  },

  // Marketing Slides (auth page split-screen)
  {
    resolve: "./src/modules/marketing-slides",
  },

  // Active Sessions (device/session tracking)
  {
    resolve: "./src/modules/active-sessions",
  },

  // Hero Slides (homepage banner)
  {
    resolve: "./src/modules/hero-slides",
  },

  // Testimonials (homepage customer reviews)
  {
    resolve: "./src/modules/testimonials",
  },

  // Newsletter Subscriptions
  {
    resolve: "./src/modules/newsletter-subscriptions",
  },

  // Product Reviews
  {
    resolve: "./src/modules/product-review",
  },

  // Product Q&A
  {
    resolve: "./src/modules/product-qa",
  },

  // Loyalty Points
  {
    resolve: "./src/modules/loyalty",
    options: {},
  },

  // Bookings (Vastu consultations)
  {
    resolve: "./src/modules/bookings",
    options: {},
  },

  // Customer Notifications
  {
    resolve: "./src/modules/notifications",
    options: {},
  },

  // Push Subscriptions (web push VAPID)
  {
    resolve: "./src/modules/push-subscriptions",
  },

  // Ecosystem Ads (banners, placements, social publishing)
  {
    resolve: "./src/modules/ecosystem-ads",
  },

  // Gift Cards (custom store credit / gift card codes)
  {
    resolve: "./src/modules/gift-cards",
  },

  // Support Tickets (customer → admin helpdesk)
  {
    resolve: "./src/modules/support-tickets",
  },

  // Payment Events (payment lifecycle logging for funnel analytics)
  {
    resolve: "./src/modules/payment-events",
  },

  // Abandoned Cart Recovery (scheduled recovery emails + conversion tracking)
  {
    resolve: "./src/modules/abandoned-cart-recovery",
  },
]

// Analytics (only if PostHog key is set)
if (process.env.POSTHOG_API_KEY) {
  modules.push({
    resolve: "@medusajs/medusa/analytics",
    options: {
      providers: [
        {
          resolve: "@medusajs/analytics-posthog",
          id: "posthog",
          options: {
            posthogEventsKey: process.env.POSTHOG_API_KEY,
            posthogHost: process.env.POSTHOG_HOST || "https://eu.i.posthog.com",
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  admin: {
    disable: true,
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET environment variable is required") })(),
      cookieSecret: process.env.COOKIE_SECRET || (() => { throw new Error("COOKIE_SECRET environment variable is required") })(),
    },
  },
  modules,
  plugins,
})
