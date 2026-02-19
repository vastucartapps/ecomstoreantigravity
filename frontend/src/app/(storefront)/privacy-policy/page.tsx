"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Privacy Policy

Your privacy is important to us. This policy explains how VastuCart collects, uses, and safeguards your personal information.

## Information We Collect

- **Account information**: Name, email address, phone number, and password when you register.
- **Order information**: Shipping address, billing address, and payment details for processing orders.
- **Usage data**: Pages visited, products viewed, and browsing behaviour on our platform.
- **Device information**: IP address, browser type, and operating system for security and analytics.

## How We Use Your Information

- To process and fulfil your orders.
- To send order confirmations, shipping updates, and customer support messages.
- To personalise your shopping experience and recommend relevant products.
- To improve our platform through analytics and feedback.
- To comply with legal obligations and prevent fraud.

## Data Sharing

We do not sell your personal data. We share information only with:

- **Payment processors** (Razorpay, Stripe) to securely handle transactions.
- **Logistics partners** for order delivery.
- **Analytics providers** (PostHog, Google Analytics) in anonymised form.

## Cookies

We use cookies to maintain your session, remember your cart, and analyse traffic. You can disable cookies in your browser settings, though some features may not function correctly.

## Your Rights

- **Access**: Request a copy of your personal data.
- **Correction**: Update inaccurate or incomplete information.
- **Deletion**: Request deletion of your account and associated data.
- **Opt-out**: Unsubscribe from marketing emails at any time.

To exercise any of these rights, email us at privacy@vastucart.com.

## Data Security

We use industry-standard encryption (TLS/SSL) for all data in transit. Passwords are hashed and never stored in plain text.

## Contact

For privacy-related queries, contact our Data Protection Officer at privacy@vastucart.com.`

export default function PrivacyPolicyPage() {
  return (
    <DynamicContentPage
      slug="privacy-policy"
      fallbackTitle="Privacy Policy"
      fallbackContent={FALLBACK}
    />
  )
}
