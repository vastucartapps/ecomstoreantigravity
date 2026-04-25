"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Consultation & Booking Terms

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

These Consultation & Booking Terms ("Consultation Terms") govern all consultation sessions, bookings, and related services ("Consultation Services") offered through the {{storeName}}® Platform. By booking a consultation, you acknowledge that you have read, understood, and unconditionally agree to these terms in full.

These Consultation Terms form part of {{storeName}}'s **Terms & Conditions** and should be read alongside them.

{{storeName}}® is operated by {{legalName}}, GSTIN {{gstin}}, {{registeredAddress}}.

---

## 1. Nature of Consultation Services

1.1 Consultation Services provided through {{storeName}} are offered **for informational, spiritual guidance, and cultural purposes only**. They are not a substitute for professional, certified, or regulated advice of any kind, including but not limited to medical, legal, financial, psychological, or licensed astrological advice.

1.2 {{storeName}} and its consultants are not licensed professionals in any regulated field. Nothing discussed, recommended, or suggested during any consultation session should be acted upon as professional or expert advice.

1.3 {{storeName}} makes **no guarantees, warranties, or representations** regarding the accuracy, reliability, or outcomes of any consultation. Results, if any, are entirely subjective and based on individual belief and personal circumstances.

1.4 {{storeName}} expressly disclaims all liability for any decisions, actions, investments, purchases, lifestyle changes, or consequences of any nature undertaken by the customer based on the content of any consultation session.

---

## 2. Booking a Consultation

2.1 Consultations are available to registered customers on the {{storeName}} Platform through the **My Bookings** section of the customer dashboard.

2.2 A booking is confirmed only upon receipt of full payment (where applicable) and a booking confirmation notification from {{storeName}}.

2.3 {{storeName}} reserves the right to accept, reject, or reschedule any booking at its sole discretion, including due to consultant availability, scheduling conflicts, or any other operational reason.

2.4 You are responsible for providing accurate booking details including your preferred date, time, contact information, and the nature of your query. {{storeName}} is not liable for any issues arising from inaccurate booking information provided by you.

---

## 3. Cancellation by Customer

3.1 **Cancellation more than 24 hours before the scheduled consultation:** You may cancel your consultation and receive a full refund to the original payment method, processed within 7–10 business days.

3.2 **Cancellation within 24 hours of the scheduled consultation:** Cancellations made within 24 hours of the scheduled time are not eligible for a refund. A credit may be offered for rescheduling at {{storeName}}'s sole discretion.

3.3 **No-Show:** If you fail to attend a scheduled consultation without prior notice, the session will be marked as completed and no refund will be issued. A no-show fee equivalent to the full consultation charge will apply.

3.4 To cancel, contact us at {{contactEmail}} or via WhatsApp at {{contactPhone}} with your booking reference number.

---

## 4. Cancellation or Rescheduling by {{storeName}}

4.1 In the event that {{storeName}} or the assigned consultant is unable to conduct the scheduled consultation due to any reason including but not limited to consultant unavailability, illness, technical issues, or force majeure, {{storeName}} will:
- Notify you as early as reasonably possible
- Offer a rescheduled slot at a mutually convenient time, OR
- Provide a full refund to the original payment method within 7–10 business days

4.2 {{storeName}}'s liability in the event of a cancellation is strictly limited to the refund of the consultation fee paid. No additional compensation, damages, or liability shall be payable.

4.3 {{storeName}} reserves the right to reschedule any consultation with reasonable notice. Customers may accept the rescheduled time or request a full refund.

---

## 5. Rescheduling by Customer

5.1 You may request to reschedule a consultation up to **12 hours before** the scheduled time, subject to consultant availability. Rescheduling is not guaranteed and is at {{storeName}}'s discretion.

5.2 Rescheduling requests made within 12 hours of the scheduled consultation time may be treated as a cancellation under Section 3.2.

5.3 Each booking may be rescheduled a maximum of one time. Subsequent rescheduling requests will be treated as cancellations.

---

## 6. Conduct During Consultation

6.1 You agree to engage respectfully and in good faith during all consultation sessions.

6.2 Consultations are for the use of the booked customer only. Sharing, recording, broadcasting, or redistributing any part of a consultation session without {{storeName}}'s prior written consent is strictly prohibited.

6.3 {{storeName}} reserves the right to terminate any consultation session immediately and without refund if the customer engages in abusive, threatening, offensive, or inappropriate behaviour toward the consultant or any {{storeName}} representative.

---

## 7. Confidentiality

7.1 {{storeName}} treats all information shared by you during a consultation session as confidential and will not disclose it to third parties except:
- As required by law or court order
- To other members of the {{storeName}} team directly involved in providing the service
- With your explicit consent

7.2 **Customer's obligation:** You agree not to record, share, publish, or disclose any part of the consultation content, advice, or materials provided by the consultant without {{storeName}}'s express written permission.

7.3 Consultation content is intended solely for your personal use. Any commercial use, redistribution, or publication of consultation content is prohibited and may constitute a breach of {{storeName}}'s intellectual property rights.

---

## 8. Disclaimer of Outcomes

8.1 {{storeName}} makes no guarantee of any outcome resulting from any consultation. Any recommendations made during a consultation are based on the consultant's personal knowledge and cultural understanding, not professional expertise.

8.2 {{storeName}} explicitly disclaims all liability for any outcome — financial, personal, relational, spiritual, or otherwise — that you attribute to or associate with the consultation.

8.3 The practice of vastu, astrology, and spiritual guidance involves significant subjectivity and individual interpretation. Results vary by individual. No consultant or platform can guarantee specific outcomes.

---

## 9. Intellectual Property in Consultations

9.1 All materials, documents, recommendations, or content provided by {{storeName}} or its consultants during or in connection with a consultation session remain the intellectual property of {{storeName}}.

9.2 You are granted a personal, non-transferable, non-commercial licence to use such materials for your own reference only.

---

## 10. Fees & Payment

10.1 Consultation fees are as displayed on the Platform at the time of booking. {{storeName}} reserves the right to revise consultation fees at any time without notice.

10.2 Full payment is required at the time of booking to confirm the session. Unpaid bookings are not confirmed and may be released.

10.3 All consultation fees are non-transferable between bookings or customers.

---

## 11. Limitation of Liability

11.1 {{storeName}}'s total liability arising from or in connection with any consultation booking shall not exceed the fee paid by the customer for that specific consultation session.

11.2 {{storeName}} shall not be liable for any indirect, incidental, consequential, or punitive damages arising from the consultation or its outcomes.

---

## 12. Governing Law & Dispute Resolution

These Consultation Terms are governed by the laws of India. Disputes shall be resolved in accordance with the dispute resolution mechanism and jurisdiction provisions set out in {{storeName}}'s **Terms & Conditions**, including the arbitration clause and exclusive jurisdiction of courts in Jhunjhunu, Rajasthan.

---

## 13. Changes to These Terms

{{storeName}} reserves the right to modify these Consultation Terms at any time without prior notice. Changes take effect immediately upon posting. Bookings confirmed before a policy change are governed by the terms in effect at the time of booking.

---

## Contact

**Email:** {{contactEmail}}
**WhatsApp:** {{contactPhone}} *(WhatsApp messages only — voice calls will not be answered)*

---

*{{storeName}}® is a registered trademark (Class 21) of {{legalName}}. GSTIN: {{gstin}}.*`

export default function ConsultationTermsPage() {
  return (
    <DynamicContentPage
      slug="consultation-terms"
      fallbackTitle="Consultation & Booking Terms"
      fallbackContent={FALLBACK}
    />
  )
}
