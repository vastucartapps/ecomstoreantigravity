"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Intellectual Property & DMCA Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

This Intellectual Property & DMCA Policy outlines the intellectual property rights of VastuCart® and the procedures for reporting copyright or trademark infringement.

VastuCart® is operated by Prashant Kumar, Sole Proprietor, GSTIN 08AWUPV3378A1ZY, VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307.

---

## 1. VastuCart® Trademark

1.1 **VastuCart® is a registered trademark** in Class 21 under the Trade Marks Act, 1999, exclusively owned by Prashant Kumar, Sole Proprietor.

1.2 The VastuCart® name, wordmark, logo, trade dress, and any stylised versions or variations thereof are the exclusive registered intellectual property of VastuCart. Unauthorised use of the VastuCart® trademark or any confusingly similar mark in connection with any goods, services, website, or business is strictly prohibited.

1.3 Unauthorised use of a registered trademark in India constitutes a criminal offence under Section 103 of the Trade Marks Act, 1999, punishable by imprisonment of up to 3 years and/or fine up to ₹2,00,000, in addition to civil remedies.

1.4 The following uses are explicitly prohibited without prior written permission:
- Using "VastuCart" or any phonetically or visually similar name as a business name, brand name, or domain name
- Using the VastuCart® logo, badge, or visual identity in any context
- Implying affiliation, partnership, or endorsement by VastuCart without explicit written authorisation
- Selling counterfeit or imitation products using the VastuCart brand

---

## 2. Copyright Ownership

2.1 All original content published on the VastuCart Platform is protected under the **Copyright Act, 1957** and applicable international copyright conventions, including the Berne Convention.

2.2 VastuCart's protected works include but are not limited to:
- **Product photography and images** — All product photos taken or commissioned by VastuCart
- **Product descriptions and written content** — All original text describing products, categories, and features
- **Website design and user interface** — The visual design, layout, colour scheme, typography, and UX of the Platform
- **Source code and software** — All frontend and backend code powering the Platform
- **Logos and brand assets** — All graphic elements comprising the VastuCart brand identity
- **Marketing materials** — All original promotional content, banners, graphics, and campaigns
- **Blog and editorial content** — All original articles, guides, and educational content published by VastuCart

2.3 Copyright in all commissioned works (photography, design, content) belongs exclusively to VastuCart upon creation, regardless of the creator.

---

## 3. Permitted Use

3.1 Users of the Platform are granted a limited, personal, non-transferable, non-exclusive, revocable licence to access and view content on the Platform solely for personal, non-commercial shopping purposes.

3.2 The following uses are **explicitly prohibited** without prior written authorisation from VastuCart:
- Reproducing, copying, or duplicating any content, image, or design from the Platform
- Distributing, publishing, or sharing Platform content on any other website, social media, or medium
- Creating derivative works based on VastuCart content
- Scraping, crawling, or automated extraction of data, product information, pricing, or images from the Platform
- Using VastuCart content for commercial purposes, advertising, or competitive intelligence
- Framing or embedding the Platform within another website without permission
- Reverse engineering any part of the Platform's software or code

---

## 4. User-Submitted Content

4.1 If you submit content to VastuCart (such as reviews, photos, questions, or feedback), you grant VastuCart a worldwide, royalty-free, perpetual, irrevocable, non-exclusive licence to use, reproduce, modify, adapt, publish, distribute, and display such content across the VastuCart ecosystem and in marketing materials, without compensation to you.

4.2 By submitting content, you represent and warrant that you own or have the necessary rights to the content and that it does not infringe any third-party intellectual property rights.

4.3 VastuCart reserves the right to remove any user-submitted content at any time, for any reason, without notice or liability.

---

## 5. Reporting Intellectual Property Infringement (DMCA & Indian Law)

If you believe that content on the VastuCart Platform infringes your copyright or trademark rights, you may submit a formal written notice to us. VastuCart respects intellectual property rights and will respond promptly to valid infringement notices.

**Your infringement notice must include:**

5.1 Your full legal name and contact information (address, email, phone number)

5.2 A description of the copyrighted work or trademark you claim has been infringed

5.3 The specific URL(s) on the VastuCart Platform where the allegedly infringing content appears

5.4 A statement that you have a good-faith belief that the use of the material is not authorised by the rights holder, its agent, or the law

5.5 A statement that the information in the notice is accurate and, under penalty of perjury, that you are the rights holder or are authorised to act on behalf of the rights holder

5.6 Your physical or digital signature

**Send infringement notices to:**

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(For written notices only)*
**Post:** Prashant Kumar, VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307

---

## 6. Counter-Notices

6.1 If you believe that content was removed from our Platform as a result of a mistake or misidentification, you may submit a written counter-notice to vastucartcare@gmail.com with the following information:
- Your contact details
- Identification of the removed content and the location where it appeared
- A statement under penalty of perjury that you believe in good faith the content was removed by mistake
- Your consent to the jurisdiction of courts in Jhunjhunu, Rajasthan

---

## 7. Repeat Infringers

VastuCart reserves the right to immediately terminate the accounts of users who are found to be repeat infringers of intellectual property rights.

---

## 8. Enforcement

VastuCart actively monitors and enforces its intellectual property rights. In cases of infringement, VastuCart reserves the right to pursue all available remedies under Indian and international law, including:
- Issuing formal cease and desist notices
- Filing complaints with domain registrars, hosting providers, and marketplaces
- Initiating civil proceedings for injunction, damages, and accounts of profits
- Filing criminal complaints under the Trade Marks Act, 1999 and Copyright Act, 1957
- Reporting infringing content to social media platforms and search engines for removal

---

## 9. Governing Law

This Policy is governed by the laws of the Republic of India, including the Trade Marks Act, 1999, the Copyright Act, 1957, and the Information Technology Act, 2000. Disputes are subject to the exclusive jurisdiction of courts in Jhunjhunu, Rajasthan, following the dispute resolution process in VastuCart's **Terms & Conditions**.

---

## Contact

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(WhatsApp messages only — voice calls will not be answered)*

---

*VastuCart® is a registered trademark (Class 21) of Prashant Kumar, Sole Proprietor. GSTIN: 08AWUPV3378A1ZY.*`

export default function IntellectualPropertyPage() {
  return (
    <DynamicContentPage
      slug="intellectual-property"
      fallbackTitle="Intellectual Property & DMCA Policy"
      fallbackContent={FALLBACK}
    />
  )
}
