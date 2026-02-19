"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Shipping Policy

We ship across India and internationally. All domestic orders are processed within 1–2 business days.

## Domestic Shipping

- **Standard**: 7–10 business days
- **Express**: 4–7 business days

All domestic shipments are handled by trusted partners including Delhivery, Bluedart, and DTDC.

## International Shipping

- **Standard**: 15–30 business days
- **Express**: 10–20 business days

International orders may be subject to customs duties and import taxes levied by the destination country. These charges are the responsibility of the recipient.

## Free Shipping

Free standard shipping on all domestic orders above ₹999. For orders below ₹999, a flat shipping fee of ₹79 applies.

## Cash on Delivery

COD is available for Indian orders between ₹500 and ₹25,000. A COD handling fee of ₹49 applies.

## Order Tracking

Once your order is dispatched, you will receive an SMS and email with the tracking number. You can track your shipment on the courier's website or from **My Orders** in your account.

## Delivery Delays

While we strive to meet all delivery timelines, delays may occur due to:

- Natural disasters or extreme weather events
- Public holidays and peak shopping seasons
- Remote delivery locations

In case of a significant delay, our support team will proactively notify you.

## Contact

For shipping queries, email support@vastucart.com or call +91 98765 43210 (Mon–Sat, 9 AM – 6 PM IST).`

export default function ShippingPolicyPage() {
  return (
    <DynamicContentPage
      slug="shipping-policy"
      fallbackTitle="Shipping Policy"
      fallbackContent={FALLBACK}
    />
  )
}
