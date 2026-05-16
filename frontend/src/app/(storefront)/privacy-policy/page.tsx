"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Privacy Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

{{storeName}}® ("we", "us", "our") is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you access or use our Platform at store.vastucart.in and its associated domains (vastucart.in, kundali.vastucart.in, panchang.vastucart.in, and any other sub-domains under the {{storeName}} ecosystem).

This Policy is published in accordance with the **Information Technology Act, 2000**, the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011**, and the **Digital Personal Data Protection Act, 2023 (DPDP Act)**.

{{storeName}} is operated by **Prashant Kumar**, Sole Proprietor, GSTIN **{{gstin}}**, {{registeredAddress}}.

By using this Platform, you consent to the collection and use of your personal data as described in this Policy.

---

## 1. What Data We Collect

We collect personal data that you provide directly, and data that is generated automatically when you use the Platform:

**Data You Provide:**
- Full name, email address, and phone number (during registration or checkout)
- Delivery and billing addresses
- Social login data if you sign in via Google OAuth (name, email, profile picture)
- Payment method type (we do not store card numbers — all card data is handled exclusively by Razorpay or Stripe)
- Consultation booking details including date, time, and notes
- Communications you send us via email or WhatsApp

**Data Collected Automatically:**
- Browsing behaviour on the Platform (pages visited, products viewed, time spent, click patterns)
- Wishlist items and cart contents
- Device information (device type, operating system, browser type and version)
- IP address and approximate geographic location
- Session identifiers and cookies (see our **Cookie Policy**)
- Order history and transaction data

---

## 2. How We Use Your Data

We use your personal data for the following purposes:

- **Order fulfilment:** Processing your orders, arranging dispatch, and coordinating delivery with courier partners
- **Account management:** Creating and maintaining your account, authenticating logins
- **Communications:** Sending order confirmations, dispatch notifications, delivery updates, and order-related alerts
- **Marketing communications:** Sending you updates about new arrivals, seasonal offers, promotions, festival greetings, and {{storeName}} news. You may opt out of marketing communications at any time by contacting us at {{contactEmail}}
- **Personalisation:** Improving your shopping experience, showing relevant products and recommendations
- **Analytics:** Understanding how the Platform is used to improve performance, design, and features
- **Fraud prevention:** Detecting, preventing, and investigating fraudulent transactions and misuse
- **Legal compliance:** Meeting obligations under applicable Indian laws

---

## 3. Cross-Platform Data Use Within the {{storeName}} Ecosystem

3.1 {{storeName}} operates multiple digital properties under the {{storeName}} brand, including but not limited to:
{{clusterDomainsList}}
- Any future sub-domains or affiliated platforms under the {{storeName}} brand

3.2 Your personal data may be shared, used, and accessed across all properties within the {{storeName}} ecosystem for the purpose of providing you with a seamless, personalised, and integrated user experience. This includes but is not limited to cross-platform login, personalised recommendations, and awareness of relevant services.

3.3 This cross-ecosystem data use is conducted solely for improving your experience and for legitimate business purposes. {{storeName}} does not engage in or intend to engage in any sale, rental, or exchange of your personal data with third parties outside the {{storeName}} ecosystem for commercial purposes.

---

## 4. Data Sharing with Third Parties

We do not sell your personal data. We share your data only with the following categories of third parties, strictly on a need-to-know basis:

- **Payment Processors:** Razorpay and Stripe receive transaction data necessary to process payments. Their privacy practices are governed by their respective privacy policies.
- **Logistics & Courier Partners:** Your name, delivery address, and phone number are shared with our courier partners solely for the purpose of delivering your order.
- **Analytics Providers:** We use PostHog and Google Analytics 4 (GA4) for platform analytics. These services may collect anonymised or pseudonymised usage data. Please refer to their respective privacy policies for details.
- **Email & Communication Services:** SendGrid or similar email service providers may be used to deliver transactional and marketing emails on our behalf.
- **Legal & Regulatory Authorities:** We may disclose your data to law enforcement agencies, courts, or government authorities where required to do so by law, court order, or in connection with legal proceedings.

We require all third parties to maintain adequate security measures and to use your data only for the specified purposes.

---

## 5. Data Security

5.1 We implement industry-standard technical and organisational security measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These measures include SSL/TLS encryption for data in transit, hashed storage of passwords, and access controls.

5.2 In the event of a personal data breach that is likely to result in a risk to your rights and freedoms, {{storeName}} will notify affected users as required under the Digital Personal Data Protection Act, 2023, and take all reasonable steps to mitigate the impact of such a breach.

5.3 Despite our best efforts, no method of data transmission over the internet or method of electronic storage is 100% secure. You acknowledge and accept this inherent risk. In the event of a breach caused by factors beyond {{storeName}}'s reasonable control, {{storeName}}'s liability shall be limited to notification obligations under applicable law.

---

## 6. Data Retention

6.1 We retain your personal data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.

6.2 Upon deletion of your account, we will remove or anonymise your personal data within a reasonable period, except where retention is required by law (for example, transaction records required for tax purposes).

---

## 7. Your Rights Under the DPDP Act, 2023

As a data principal under the Digital Personal Data Protection Act, 2023, you have the following rights:

- **Right to Access:** Request information about what personal data we hold about you
- **Right to Correction:** Request correction of inaccurate or incomplete personal data
- **Right to Erasure:** Request deletion of your personal data, subject to legal retention requirements
- **Right to Grievance Redressal:** File a complaint with our Grievance Officer regarding data processing
- **Right to Withdraw Consent:** Withdraw consent for non-essential data processing at any time (note: this may affect your ability to use certain features)
- **Right to Nominate:** Nominate another individual to exercise your rights in the event of your death or incapacity

To exercise any of these rights, contact our Grievance Officer at {{contactEmail}}. We will respond within 30 days.

---

## 8. Cookies

We use cookies and similar tracking technologies on our Platform. Please refer to our **Cookie Policy** for detailed information on the types of cookies we use, their purposes, and how to manage your cookie preferences.

---

## 9. Children's Privacy

Our Platform is not directed at individuals under the age of 18. We do not knowingly collect personal data from minors. If we become aware that a minor has provided us with personal data without parental consent, we will delete it promptly.

---

## 10. Changes to This Policy

{{storeName}} reserves the right to update or modify this Privacy Policy at any time without prior notice. The updated Policy will be effective immediately upon posting. We encourage you to review this Policy periodically. Continued use of the Platform after any modification constitutes acceptance of the revised Policy.

---

## 11. Grievance Officer

For privacy-related queries, concerns, or to exercise your rights under the DPDP Act, 2023:

**Name:** Prashant Kumar
**Designation:** Proprietor & Grievance Officer
**Email:** {{contactEmail}}
**WhatsApp:** {{contactPhone}} *(WhatsApp messages only — voice calls will not be answered)*
**Address:** {{registeredAddress}}

Grievances will be acknowledged within **48 hours** and resolved within **30 days** of receipt.

---

*{{storeName}}® is a registered trademark (Class 21) of {{legalName}}. GSTIN: {{gstin}}.*`

export default function PrivacyPolicyPage() {
  return (
    <DynamicContentPage
      slug="privacy-policy"
      fallbackTitle="Privacy Policy"
      fallbackContent={FALLBACK}
    />
  )
}
