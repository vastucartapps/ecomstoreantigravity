"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Acceptable Use Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

This Acceptable Use Policy ("AUP") governs the permitted and prohibited uses of the VastuCart® Platform by all visitors, users, registered customers, and any other person accessing the Platform in any capacity.

This AUP forms an integral part of VastuCart's **Terms & Conditions** and must be read in conjunction with them. Violation of this AUP may result in immediate account suspension or termination, cancellation of pending orders, and legal action.

VastuCart® is operated by Prashant Kumar, Sole Proprietor, GSTIN 08AWUPV3378A1ZY, VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307.

---

## 1. Permitted Use

The VastuCart Platform may be used solely for the following lawful purposes:
- Browsing and purchasing products for personal, non-commercial use
- Managing your customer account and order history
- Booking consultation services for personal use
- Contacting customer support in good faith
- Leaving genuine, first-hand product reviews based on your actual purchase experience
- Sharing product links through personal social channels for non-commercial purposes

---

## 2. Prohibited Conduct

The following activities are strictly prohibited on or in connection with the VastuCart Platform:

### 2.1 Fraudulent & Deceptive Activity
- Placing fraudulent, fictitious, or test orders with no intent to complete payment or accept delivery
- Providing false, misleading, or inaccurate information during registration, checkout, or any communication with VastuCart
- Using stolen, cloned, or unauthorised payment credentials
- Initiating false chargebacks or fraudulent payment disputes
- Impersonating another person, customer, or VastuCart employee
- Creating multiple accounts to exploit promotions, discounts, or referral schemes

### 2.2 Abusive & Harmful Behaviour
- Using abusive, threatening, harassing, defamatory, or offensive language in any communication with VastuCart staff, consultants, or other users
- Engaging in conduct that intimidates, threatens, or harms any VastuCart employee, consultant, or representative
- Submitting fake, fabricated, or malicious product reviews, ratings, or Q&A responses
- Attempting to manipulate VastuCart's review, rating, loyalty, or recommendation systems

### 2.3 Unauthorised Technical Access
- Attempting to gain unauthorised access to VastuCart's systems, databases, servers, or any connected infrastructure
- Using automated bots, scripts, crawlers, scrapers, or any automated means to access, extract, or collect data from the Platform
- Attempting to reverse engineer, decompile, disassemble, or derive the source code of any part of the Platform
- Introducing viruses, malware, spyware, ransomware, denial-of-service attacks, or any other harmful code or content
- Probing, scanning, or testing the vulnerability of VastuCart's systems without explicit written authorisation
- Circumventing or attempting to bypass any security, authentication, or access control measures

### 2.4 Intellectual Property Violations
- Copying, reproducing, distributing, or publishing VastuCart's content, images, product descriptions, or code without authorisation
- Using VastuCart's registered trademark, logo, or brand identity without prior written permission
- Scraping product data, pricing, or images for use on competing platforms or for commercial intelligence

### 2.5 Misuse of Promotions & Loyalty Programme
- Using automated means, fake accounts, or fraudulent orders to accumulate Loyalty Points, discount codes, or promotional benefits
- Selling, transferring, or attempting to monetise Loyalty Points or promotional credits
- Exploiting pricing errors or platform bugs to obtain products or services at unintended prices
- Coordinating with others to artificially game VastuCart's promotional systems

### 2.6 Commercial Exploitation
- Reselling products purchased from VastuCart without prior written authorisation
- Using VastuCart as a dropshipping source without a formal written agreement
- Using the Platform for competitive intelligence, price monitoring, or market research without written permission
- Mass purchasing of products to restrict availability for genuine customers

### 2.7 Unlawful Activity
- Using the Platform for any purpose that violates applicable Indian law, including but not limited to the Information Technology Act, 2000, the Consumer Protection Act, 2019, the Indian Penal Code, or any other statute
- Engaging in money laundering or financial fraud through Platform transactions
- Using the Platform to facilitate illegal trade or distribution of any kind

---

## 3. Reviews & User-Generated Content

3.1 Reviews must be based on genuine, first-hand purchase and usage experience of the specific product reviewed.

3.2 Reviews must not contain:
- False or misleading claims about a product
- Personal attacks on VastuCart employees or other customers
- Irrelevant content unrelated to the product
- Promotional content for competing brands or services
- Spam, links, or solicitation of any kind

3.3 VastuCart reserves the right to remove any review that violates this Policy or that VastuCart, in its sole discretion, considers inappropriate, misleading, or harmful.

3.4 Attempting to coerce, incentivise, or pressure VastuCart to remove legitimate negative reviews constitutes a violation of this AUP.

---

## 4. Consequences of Violations

VastuCart reserves the right to take any or all of the following actions in response to a violation of this AUP, at its sole discretion and without prior notice:

- **Immediate account suspension or permanent termination**
- **Cancellation of all pending orders** without refund where fraud is involved
- **Forfeiture of all Loyalty Points** and promotional benefits
- **Restriction of access** to the Platform, including blocking IP addresses or devices
- **Legal action** — VastuCart will actively pursue civil and/or criminal legal remedies for violations involving fraud, unauthorised access, intellectual property infringement, or other serious offences
- **Reporting to law enforcement** where criminal conduct is suspected
- **Recovery of damages** — VastuCart may seek to recover all losses, costs, and damages caused by the violation, including legal fees

---

## 5. Reporting Violations

If you become aware of any person violating this AUP on the VastuCart Platform, or if you encounter any content or conduct that appears to violate this Policy, please report it to us immediately:

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(WhatsApp messages only — voice calls will not be answered)*

All reports are treated confidentially. VastuCart will investigate all credible reports and take appropriate action.

---

## 6. No Waiver

VastuCart's failure to enforce any provision of this AUP in any particular instance does not constitute a waiver of VastuCart's right to enforce the same provision in future instances or against other users.

---

## 7. Changes to This Policy

VastuCart reserves the right to update or modify this AUP at any time without prior notice. Changes take effect immediately upon posting. Continued use of the Platform constitutes acceptance of the revised AUP.

---

## 8. Governing Law

This AUP is governed by the laws of the Republic of India. Disputes are subject to the dispute resolution mechanism and exclusive jurisdiction of courts in Jhunjhunu, Rajasthan, as described in VastuCart's **Terms & Conditions**.

---

*VastuCart® is a registered trademark (Class 21) of Prashant Kumar, Sole Proprietor. GSTIN: 08AWUPV3378A1ZY.*`

export default function AcceptableUsePage() {
  return (
    <DynamicContentPage
      slug="acceptable-use"
      fallbackTitle="Acceptable Use Policy"
      fallbackContent={FALLBACK}
    />
  )
}
