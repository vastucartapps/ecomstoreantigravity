"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Shipping Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

This Shipping Policy governs all shipments made through the VastuCart® Platform. By placing an order, you acknowledge and agree to the terms of this Policy.

VastuCart is operated by Prashant Kumar, Sole Proprietor, GSTIN 08AWUPV3378A1ZY, VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307.

---

## 1. What VastuCart Guarantees

**VastuCart guarantees dispatch — not delivery.**

We commit to processing and handing over your order to our courier partner within the timeframes described below. Once the order is dispatched and handed over to the courier, VastuCart's control over the shipment ends. Delivery timelines are provided as estimates only and are subject to factors outside our control including but not limited to:
- Courier partner operations, capacity, and network coverage
- Weather conditions, natural disasters, or force majeure events
- Government restrictions, curfews, or bandhs
- Remote, difficult, or restricted delivery locations
- Customs clearance for international shipments
- Public holidays and peak season volumes
- Incorrect or incomplete address provided by the customer

VastuCart shall not be held liable for any delays, losses, or damages caused by courier partners or any of the above circumstances.

---

## 2. Order Processing & Dispatch

2.1 Orders placed before **10:00 AM IST** on a business day are generally dispatched the same day, subject to stock availability and order verification.

2.2 Orders placed after 10:00 AM IST are generally dispatched the next business day.

2.3 Customised, personalised, or made-to-order products are generally dispatched the next business day after completion, but this timeline may vary based on production requirements, material availability, and order volume.

2.4 Business days are Monday through Saturday, excluding national public holidays.

2.5 VastuCart reserves the right to revise dispatch timelines at any time without prior notice due to operational requirements, peak seasons, inventory constraints, or any other reason.

---

## 3. Courier Partners

VastuCart ships via reputed courier partners selected at our discretion based on your location, the nature of the shipment, and service availability. We do not commit to any specific courier service. The courier partner for your shipment will be determined at the time of dispatch.

For **Express Shipping**, we use the fastest available courier option at the time of dispatch. For **Standard Shipping**, we use standard courier services which may take variable time depending on the destination.

---

## 4. Domestic Shipping (Within India)

| Service | Estimated Delivery |
|---|---|
| Standard Shipping | 7–15 business days from dispatch |
| Express Shipping | 4–7 business days from dispatch |

4.1 These timelines are estimates only and are not guaranteed. Actual delivery may take longer depending on your location, courier operations, and other factors.

4.2 Delivery to remote areas, hilly regions, or locations with limited courier coverage may take longer than the above estimates. VastuCart is not liable for such extended timelines.

4.3 Shipping charges, if any, are displayed at checkout and are calculated based on your location, order weight, and selected shipping method.

---

## 5. International Shipping

| Service | Estimated Delivery |
|---|---|
| Standard International | 20–30 business days from dispatch |
| Express International | 15–20 business days from dispatch |

5.1 International delivery estimates are approximate and are significantly subject to customs clearance timelines, which vary by country and are entirely outside VastuCart's control.

5.2 **Customs Duties & Import Taxes:** All customs duties, import taxes, VAT, and any other charges levied by the destination country's authorities are the sole responsibility of the recipient. VastuCart has no control over these charges and cannot predict their amount. Non-payment of customs duties may result in the shipment being held, returned, or destroyed by customs authorities, and VastuCart will not be liable for any resulting loss.

5.3 VastuCart is not responsible for items confiscated, held, or destroyed by customs or import authorities.

5.4 International orders are subject to export regulations of India and import regulations of the destination country. By placing an international order, you confirm that the products ordered are legally importable in your country.

---

## 6. Cash on Delivery (COD) Shipping

6.1 COD availability is determined at checkout based on your delivery pincode and order value.

6.2 **Prepaid orders are given strict priority over COD orders** in all circumstances, including dispatch scheduling. COD orders may be dispatched after prepaid orders even if placed earlier.

6.3 VastuCart reserves the right to cancel any COD order at any time before dispatch without liability.

6.4 COD orders are not eligible for free gifts, promotional offers, or any special benefits unless explicitly stated.

6.5 Repeated non-acceptance of COD deliveries may result in permanent restriction of COD access.

---

## 7. Order Tracking

7.1 Once your order is dispatched, you will receive a dispatch notification with tracking details via your registered email address and/or phone number.

7.2 You can track your order from the **My Orders** section of your account dashboard, or directly on the courier partner's website using the tracking number provided.

7.3 VastuCart is not responsible for delays or inaccuracies in tracking information, as this is managed by the courier partner.

---

## 8. Failed Delivery & Returns to Origin

8.1 If a delivery attempt is unsuccessful because of an incorrect address, customer unavailability, or refusal to accept, the courier partner will make a limited number of attempts (subject to their policy) before returning the shipment to VastuCart.

8.2 For prepaid orders returned to origin due to reasons attributable to the customer (wrong address, unavailability, refusal), reshipping charges will apply and are the customer's responsibility. VastuCart will contact you to arrange reshipment.

8.3 If a prepaid order is returned to origin and the customer does not wish to reship, a partial refund may be issued after deducting original shipping charges, return shipping charges, and a handling fee. The amount will be determined at VastuCart's sole discretion.

8.4 For COD orders returned to origin, VastuCart reserves the right to restrict future COD access for the customer.

---

## 9. Safe Packaging

VastuCart takes pride in safe, secure, and sustainable packaging. All orders are carefully packed to minimise the risk of damage in transit. However, VastuCart's responsibility for the safe condition of the product ends upon handover to the courier. Please refer to our **Return & Refund Policy** for procedures in case of transit damage.

---

## 10. Policy Changes

VastuCart reserves the right to update or modify this Shipping Policy at any time without prior notice. Changes take effect immediately upon posting. It is your responsibility to review this Policy before placing each order.

---

## Contact for Shipping Queries

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(WhatsApp messages only — voice calls will not be answered)*

Please allow 48–72 business hours for a response.

---

*VastuCart® is a registered trademark (Class 21) of Prashant Kumar, Sole Proprietor. GSTIN: 08AWUPV3378A1ZY.*`

export default function ShippingPolicyPage() {
  return (
    <DynamicContentPage
      slug="shipping-policy"
      fallbackTitle="Shipping Policy"
      fallbackContent={FALLBACK}
    />
  )
}
