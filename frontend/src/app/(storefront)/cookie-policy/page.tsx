"use client"

import { DynamicContentPage } from "@/components/storefront/DynamicContentPage"

const FALLBACK = `# Cookie Policy

**Effective Date:** February 26, 2026
**Last Updated:** February 26, 2026

This Cookie Policy explains how VastuCart® uses cookies and similar tracking technologies on our Platform at store.vastucart.in and its associated domains. It should be read alongside our **Privacy Policy**.

VastuCart® is operated by Prashant Kumar, Sole Proprietor, GSTIN 08AWUPV3378A1ZY, VastuCart Premiere Enc, HN 2, Via Udaipurwati, Jhunjhunu, Rajasthan – 333307.

---

## 1. What Are Cookies?

Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They allow the website to remember your actions and preferences over time, and help us understand how visitors interact with our Platform.

Similar technologies such as local storage, session storage, pixels, and analytics beacons function in a comparable way and are also covered by this Policy.

---

## 2. Types of Cookies We Use

### 2.1 Strictly Necessary Cookies
These cookies are essential for the Platform to function. They enable core features such as:
- Maintaining your login session
- Remembering items in your cart
- Completing checkout and payment processing
- Security and fraud prevention

These cookies cannot be disabled without significantly impairing your ability to use the Platform. They do not require your consent under applicable law as they are necessary for the service you have requested.

### 2.2 Analytics & Performance Cookies
We use analytics tools to understand how visitors use our Platform, which pages are most visited, how long users stay, and where they come from. This helps us improve the Platform experience.

**Tools we use:**
- **Google Analytics 4 (GA4):** Collects anonymised data about page views, user journeys, device types, and geographic regions. Governed by Google's Privacy Policy.
- **PostHog:** Collects usage data including page events, clicks, form interactions, and session recordings for product analytics. Governed by PostHog's Privacy Policy.

Data collected by analytics cookies is pseudonymised and used in aggregate form. We do not use analytics data to identify individual users.

### 2.3 Functional & Preference Cookies
These cookies remember your preferences to personalise your experience, including:
- Your preferred language or region
- Your wishlist and recently viewed products
- Announcement ribbon dismissal preferences
- Cart and checkout state

### 2.4 Third-Party Cookies
Some of our payment and service partners may set their own cookies when you interact with their services on our Platform:
- **Razorpay:** Sets cookies necessary for secure payment processing
- **Stripe:** Sets cookies for payment fraud detection and security
- **Google (reCAPTCHA / OAuth):** May set cookies if you use Google Sign-In

These third-party cookies are governed by the respective third party's cookie and privacy policies. VastuCart does not control or have access to the data collected by these cookies.

---

## 3. Why We Use Cookies

We use cookies and tracking technologies for the following purposes:
- To keep you signed in across sessions
- To maintain your shopping cart between visits
- To process payments securely
- To measure Platform performance and identify areas for improvement
- To personalise your experience and show relevant products
- To detect and prevent fraud and abuse
- To comply with legal and security requirements

---

## 4. Cookie Retention Periods

| Cookie Type | Typical Retention |
|---|---|
| Session cookies | Deleted when you close your browser |
| Authentication cookies | Up to 30 days |
| Analytics cookies | Up to 13 months |
| Preference cookies | Up to 12 months |

Specific retention periods may vary based on the third-party service. Refer to the respective provider's policies for exact details.

---

## 5. Managing & Disabling Cookies

**Browser Settings:** Most browsers allow you to view, manage, block, or delete cookies through their settings. Common browser cookie management guides:
- **Chrome:** Settings → Privacy and Security → Cookies
- **Firefox:** Settings → Privacy & Security → Cookies and Site Data
- **Safari:** Preferences → Privacy → Manage Website Data
- **Edge:** Settings → Cookies and Site Permissions

**Important:** Disabling or deleting cookies may impair your ability to use certain features of the Platform, including staying logged in, maintaining your cart, and completing checkout.

**Analytics Opt-Out:**
- Google Analytics: You can opt out via the [Google Analytics Opt-out Browser Add-on](https://tools.google.com/dlpage/gaoptout)
- PostHog: You may opt out of session recording and analytics by contacting us at vastucartcare@gmail.com

---

## 6. Do Not Track

Some browsers support a "Do Not Track" (DNT) signal. At this time, VastuCart does not alter its data collection practices in response to DNT signals, as there is no universal standard for interpreting these signals.

---

## 7. Changes to This Cookie Policy

VastuCart reserves the right to update this Cookie Policy at any time without prior notice. Changes take effect immediately upon posting on the Platform. We encourage you to review this Policy periodically.

---

## 8. Contact

For questions about our use of cookies or to request analytics opt-out:

**Email:** vastucartcare@gmail.com
**WhatsApp:** +91 94611 94356 *(WhatsApp messages only — voice calls will not be answered)*

---

*VastuCart® is a registered trademark (Class 21) of Prashant Kumar, Sole Proprietor. GSTIN: 08AWUPV3378A1ZY.*`

export default function CookiePolicyPage() {
  return (
    <DynamicContentPage
      slug="cookie-policy"
      fallbackTitle="Cookie Policy"
      fallbackContent={FALLBACK}
    />
  )
}
