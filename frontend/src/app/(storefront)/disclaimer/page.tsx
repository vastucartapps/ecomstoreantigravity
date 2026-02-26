"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Disclaimer

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

Please read this Disclaimer carefully before using the VastuCart® Platform or purchasing any product or service. By accessing this Platform or making a purchase, you acknowledge that you have read, understood, and agreed to the terms of this Disclaimer in full.

---

## 1. Spiritual & Vastu Efficacy Disclaimer

1.1 VastuCart® sells devotional, decorative, spiritual, and vastu products including but not limited to idols, statues, malas, rudraksha, yantras, crystals, incense, puja accessories, and related items. **All products are sold strictly for devotional, decorative, and collectible purposes only.**

1.2 VastuCart makes **no representations, claims, warranties, or guarantees** of any kind — express or implied — regarding the spiritual efficacy, vastu benefits, energetic properties, healing properties, astrological significance, religious power, or any supernatural qualities of any product sold on the Platform.

1.3 Any references in product descriptions, titles, marketing material, or communications to concepts such as "prosperity," "good luck," "protection," "positive energy," "vastu compliance," "spiritual strength," "negativity removal," "blessings," or similar terms are used solely in a **cultural, traditional, devotional, and descriptive context**. These terms reflect the traditional beliefs associated with such products and **do not constitute factual claims, scientific assertions, or guaranteed outcomes**.

1.4 **Results, if any, from the use of our products are purely based on individual belief, faith, and personal experience.** VastuCart is not responsible — directly or indirectly — for any decisions, actions, investments, expenditures, lifestyle changes, or consequences undertaken by any person based on perceived or expected benefits of any product purchased from VastuCart.

1.5 Our products are not substitutes for professional medical, psychological, legal, financial, or astrological advice. If you are dealing with a health condition, mental health issue, financial difficulty, or legal matter, please consult a qualified professional.

---

## 2. No Medical or Health Claims

2.1 Nothing on this Platform, in our product descriptions, or in any communication from VastuCart should be interpreted as medical advice, health advice, therapeutic recommendations, or a substitute for professional medical consultation.

2.2 VastuCart does not claim that any product prevents, treats, cures, or mitigates any disease, disorder, condition, or health issue.

2.3 If you have a medical condition or health concern, please consult a qualified and registered medical practitioner.

---

## 3. Product Representation Disclaimer

3.1 While we strive for accuracy, product images, photographs, and representations on the Platform are for illustrative purposes only. Actual products may vary slightly in colour, shade, finish, texture, grain pattern, dimensions, or weight from what is displayed.

3.2 Variations arising from the handcrafted, natural, or artisanal nature of a product are not defects and do not qualify for return or refund.

3.3 VastuCart reserves the right to use representative or artistic photography for product listings. The presence of decorative elements, props, or backgrounds in product images does not imply their inclusion with the purchase.

---

## 4. Website Content Disclaimer

4.1 The content published on this Platform — including articles, blog posts, product descriptions, educational content, and spiritual guidance — is provided for general informational and educational purposes only. It does not constitute professional advice of any kind.

4.2 VastuCart makes no warranty regarding the accuracy, completeness, timeliness, or reliability of any content on the Platform. Information may be outdated, incomplete, or subject to interpretation.

4.3 VastuCart reserves the right to modify, update, remove, or correct any content on the Platform at any time without notice.

---

## 5. External Links Disclaimer

5.1 The Platform may contain links to external websites, platforms, or resources operated by third parties. These links are provided for convenience only and do not constitute an endorsement of the linked site, its content, its products, or its operators.

5.2 VastuCart has no control over and accepts no responsibility for the content, privacy practices, security, or reliability of any external site or resource. Your use of external sites is at your own risk and subject to the terms and policies of those sites.

---

## 6. Consultation Services Disclaimer

6.1 Consultation services offered through the VastuCart Platform are provided for spiritual guidance and informational purposes only. They do not constitute professional, certified, or regulated advice of any kind.

6.2 VastuCart and its consultants are not liable for any decisions, actions, or outcomes that result from consultation sessions.

6.3 Please refer to our **Consultation & Booking Terms** for the complete terms governing consultation services.

---

## 7. Technical & Platform Disclaimer

7.1 VastuCart makes no warranty that the Platform will be continuously available, uninterrupted, error-free, or free from viruses, malware, or technically harmful material.

7.2 VastuCart is not responsible for any loss of data, loss of business, or any other damage resulting from technical failures, outages, errors, or interruptions of the Platform.

7.3 VastuCart reserves the right to suspend, modify, or discontinue any part of the Platform at any time without notice.

---

## 8. Data Security Disclaimer

8.1 VastuCart implements industry-standard security measures to protect user data. However, no internet transmission or electronic storage system is completely secure. VastuCart cannot guarantee the absolute security of data transmitted to or from the Platform.

8.2 In the event of a data security breach caused by factors beyond VastuCart's reasonable control, VastuCart's liability shall be limited to the notification obligations required under applicable Indian law. VastuCart shall not be liable for indirect, consequential, or punitive damages arising from any such breach.

---

## 9. Limitation of Liability

To the maximum extent permitted by applicable law, VastuCart, its proprietor, employees, agents, and representatives expressly disclaim all liability for any direct, indirect, incidental, consequential, special, exemplary, or punitive damages arising from:
- The use of or inability to use the Platform
- The purchase, use, or display of any product
- Reliance on any content, claims, or information on the Platform
- Any service interruption, data loss, or technical failure
- Any decisions made based on spiritual, vastu, or religious product beliefs

---

## 10. Governing Law

This Disclaimer is governed by the laws of the Republic of India. Any disputes arising from this Disclaimer shall be subject to the dispute resolution mechanism and jurisdiction described in VastuCart's **Terms & Conditions**.

---

## Contact

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(WhatsApp messages only — voice calls will not be answered)*

---

*VastuCart® is a registered trademark (Class 21) of Prashant Kumar, Sole Proprietor. GSTIN: 08AWUPV3378A1ZY.*`

export default function DisclaimerPage() {
  return (
    <DynamicContentPage
      slug="disclaimer"
      fallbackTitle="Disclaimer"
      fallbackContent={FALLBACK}
    />
  )
}
