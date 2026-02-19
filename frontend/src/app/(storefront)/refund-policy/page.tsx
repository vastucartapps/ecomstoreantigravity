"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Refund & Returns Policy

We want you to be completely satisfied with your purchase. If for any reason you are not, we offer a straightforward returns and refund process.

## Return Window

Returns are accepted within **7 days** of delivery for most products. Certain categories (puja essentials, incense, and perishable items) are non-returnable for hygiene reasons.

## Eligibility for Returns

To be eligible for a return:

- The item must be unused and in its original packaging.
- All accessories, manuals, and gift items included in the original order must be returned.
- The return request must be raised within the return window.

## Non-Returnable Items

- Customised or personalised products.
- Items marked as "Final Sale" at the time of purchase.
- Digital products and downloadable content.
- Perishable goods such as fresh flowers or food items.

## How to Initiate a Return

- Log in to your account and go to **My Orders**.
- Select the order and click **Request Return**.
- Choose the items and provide a reason.
- Our team will review and approve the request within 24–48 hours.
- A return pickup will be scheduled or you may drop off the parcel at a designated courier point.

## Refund Process

- **Prepaid orders**: Refund is credited to the original payment method within 5–7 business days after the returned item is received and inspected.
- **COD orders**: Refund is credited to your bank account via NEFT within 7–10 business days.
- Shipping charges are non-refundable unless the return is due to our error.

## Damaged or Incorrect Items

If you receive a damaged or incorrect item, please contact us within 48 hours of delivery at returns@vastucart.com with photos. We will arrange a replacement or full refund at no extra cost.

## Contact

For return queries, email returns@vastucart.com or call +91 98765 43210 (Mon–Sat, 9 AM – 6 PM IST).`

export default function RefundPolicyPage() {
  return (
    <DynamicContentPage
      slug="refund-policy"
      fallbackTitle="Refund & Returns Policy"
      fallbackContent={FALLBACK}
    />
  )
}
