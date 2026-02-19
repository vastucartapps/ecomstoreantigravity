"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Terms & Conditions

By using VastuCart, you agree to the following terms. Please read them carefully before making a purchase.

## Acceptance of Terms

By accessing or using our website, you agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use our platform.

## Eligibility

You must be at least 18 years old to create an account and place orders on VastuCart. By registering, you confirm that you meet this requirement.

## Account Responsibility

- You are responsible for maintaining the confidentiality of your account credentials.
- All activities that occur under your account are your responsibility.
- Notify us immediately at support@vastucart.com if you suspect unauthorised access.

## Products and Pricing

- All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.
- We reserve the right to modify prices without prior notice.
- Product images are for illustrative purposes; minor variations may exist.

## Orders and Payments

- Orders are confirmed only upon successful payment.
- We reserve the right to cancel orders in cases of pricing errors, fraud suspicion, or stock unavailability.
- Full payment is required before dispatch for prepaid orders.

## Intellectual Property

All content on VastuCart — including images, text, logos, and product descriptions — is the property of VastuCart India Pvt. Ltd. and may not be reproduced without written permission.

## Limitation of Liability

VastuCart shall not be liable for indirect, incidental, or consequential damages arising from the use of our platform or products. Our maximum liability is limited to the order value paid.

## Governing Law

These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in New Delhi.

## Changes to Terms

We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the revised terms.

## Contact

For any questions regarding these terms, contact us at legal@vastucart.com.`

export default function TermsPage() {
  return (
    <DynamicContentPage
      slug="terms"
      fallbackTitle="Terms & Conditions"
      fallbackContent={FALLBACK}
    />
  )
}
