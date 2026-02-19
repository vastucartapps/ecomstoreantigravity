"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Contact Us

We'd love to hear from you. Reach out through any of the channels below and our team will respond within 24 hours.

## Customer Support

- **Email**: support@vastucart.com
- **Phone**: +91 98765 43210
- **Hours**: Monday – Saturday, 9:00 AM – 6:00 PM IST

## Office Address

VastuCart India Pvt. Ltd.
12, Artisan Lane, Sector 4
New Delhi – 110 001, India

## Vastu Consultation

Interested in a personalised Vastu consultation? Book a session directly from your account dashboard under **My Bookings**.

## Returns & Complaints

For returns or complaints, please email us at returns@vastucart.com with your order number and we will process your request within 48 hours.`

export default function ContactPage() {
  return (
    <DynamicContentPage
      slug="contact"
      fallbackTitle="Contact Us"
      fallbackContent={FALLBACK}
    />
  )
}
